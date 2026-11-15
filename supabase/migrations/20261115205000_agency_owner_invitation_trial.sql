-- Invitation-only onboarding: 72h one-use invite, verified owner and two lifetime free memorials.
create table if not exists public.agency_owner_invitations(
 id uuid primary key default gen_random_uuid(),
 legal_name text not null check(char_length(btrim(legal_name)) between 2 and 240),
 vat_number text not null check(char_length(btrim(vat_number)) between 5 and 32),
 country_code char(2) not null default 'IT',
 invited_email text not null check(char_length(invited_email)<=254),
 token_hash text not null unique,
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default (now()+interval '72 hours'),
 accepted_at timestamptz,
 revoked_at timestamptz,
 agency_id uuid references public.agencies(id)
);
alter table public.agency_owner_invitations enable row level security;
revoke all on public.agency_owner_invitations from public,anon,authenticated;

create table if not exists public.agency_free_entitlements(
 agency_id uuid primary key references public.agencies(id),
 total integer not null default 2 check(total=2),
 used integer not null default 0 check(used between 0 and 2),
 granted_at timestamptz not null default now()
);
alter table public.agency_free_entitlements enable row level security;
revoke all on public.agency_free_entitlements from public,anon,authenticated;

create table if not exists public.agency_free_memorial_activations(
 memorial_id uuid primary key references public.memorials(id),
 agency_id uuid not null references public.agencies(id),
 activated_at timestamptz not null default now(),
 created_by uuid not null references auth.users(id)
);
alter table public.agency_free_memorial_activations enable row level security;
revoke all on public.agency_free_memorial_activations from public,anon,authenticated;

create or replace function public.platform_invite_agency_owner(company text,tax_id text,invite_email text,invite_country text default 'IT')
returns jsonb language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); company_name text:=btrim(coalesce(company,''));
 tax text:=upper(regexp_replace(coalesce(tax_id,''),'[[:space:]]','','g'));
 email_text text:=lower(btrim(coalesce(invite_email,'')));
 nation text:=upper(btrim(coalesce(invite_country,'IT'))); token text; uid uuid;
begin
 if actor is null or not exists(select 1 from public.platform_memberships p where p.user_id=actor and p.role='OWNER' and p.active)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 if char_length(company_name) not between 2 and 240 or char_length(tax) not between 5 and 32
  or nation !~ '^[A-Z]{2}$' or char_length(email_text)>254
  or email_text !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
 then raise exception 'INVALID_AGENCY_DATA' using errcode='22023';end if;
 if exists(select 1 from public.agencies a where a.country_code=nation and upper(coalesce(a.vat_number,''))=tax)
 then raise exception 'AGENCY_ALREADY_EXISTS' using errcode='23505';end if;
 update public.agency_owner_invitations
 set revoked_at=now()
 where invited_email=email_text and accepted_at is null and revoked_at is null;
 token:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
 insert into public.agency_owner_invitations(legal_name,vat_number,country_code,invited_email,token_hash,created_by)
 values(company_name,tax,nation,email_text,encode(sha256(convert_to(token,'UTF8')),'hex'),actor)
 returning id into uid;
 return jsonb_build_object('id',uid,'email',email_text,'token',token,'expires_at',now()+interval '72 hours');
end $$;

create or replace function public.platform_agency_invitation_directory()
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); value jsonb;
begin
 if actor is null or not exists(select 1 from public.platform_memberships p where p.user_id=actor and p.role='OWNER' and p.active)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',i.id,'company',i.legal_name,'email',i.invited_email,
 'created_at',i.created_at,'expires_at',i.expires_at,'accepted_at',i.accepted_at,'revoked_at',i.revoked_at)
 order by i.created_at desc),'[]'::jsonb)
 into value from (select * from public.agency_owner_invitations order by created_at desc limit 100) i;
 return value;
end $$;

create or replace function public.platform_revoke_agency_owner_invitation(invite_key uuid)
returns boolean language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid();
begin
 if actor is null or not exists(select 1 from public.platform_memberships p where p.user_id=actor and p.role='OWNER' and p.active)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 update public.agency_owner_invitations
 set revoked_at=now() where id=invite_key and accepted_at is null and revoked_at is null;
 return found;
end $$;

create or replace function public.accept_agency_owner_invitation(invitation_token text,accepted_terms text,accepted_privacy text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); email_text text; verified timestamptz;
 rec public.agency_owner_invitations%rowtype; agency_new uuid; chosen_terms text; chosen_privacy text;
begin
 if actor is null or invitation_token !~ '^[a-f0-9]{64}$'
 then raise exception 'INVALID_OR_UNAUTHENTICATED_INVITATION' using errcode='42501';end if;
 select lower(email),email_confirmed_at into email_text,verified from auth.users where id=actor;
 if verified is null then raise exception 'EMAIL_NOT_VERIFIED' using errcode='42501';end if;
 select * into rec from public.agency_owner_invitations
 where token_hash=encode(sha256(convert_to(invitation_token,'UTF8')),'hex') for update;
 if not found or rec.accepted_at is not null or rec.revoked_at is not null or rec.expires_at<=now() or rec.invited_email<>email_text
 then raise exception 'INVITATION_EXPIRED_OR_INVALID' using errcode='42501';end if;
 select d.version into chosen_terms from public.agency_legal_documents d where d.kind='B2B_TERMS' and d.active;
 select d.version into chosen_privacy from public.agency_legal_documents d where d.kind='PRIVACY_NOTICE' and d.active;
 if chosen_terms is null or chosen_privacy is null
 then raise exception 'LEGAL_DOCUMENTS_UNAVAILABLE' using errcode='22023';end if;
 if accepted_terms<>chosen_terms or accepted_privacy<>chosen_privacy
 then raise exception 'LEGAL_DOCUMENTS_NOT_ACCEPTED' using errcode='22023';end if;
 if exists(select 1 from public.agencies a where a.country_code=rec.country_code and upper(coalesce(a.vat_number,''))=rec.vat_number)
 then raise exception 'AGENCY_ALREADY_EXISTS' using errcode='23505';end if;
 insert into public.agencies(legal_name,vat_number,country_code,contact_email,plan,status,is_demo)
 values(rec.legal_name,rec.vat_number,rec.country_code,rec.invited_email,'FREE','ACTIVE',false)
 returning id into agency_new;
 insert into public.agency_members(agency_id,user_id,role,active,is_demo)
 values(agency_new,actor,'OWNER',true,false);
 insert into public.agency_registration_acceptances(agency_id,user_id,terms_version,privacy_version)
 values(agency_new,actor,chosen_terms,chosen_privacy);
 insert into public.agency_free_entitlements(agency_id,total,used)
 values(agency_new,2,0);
 update public.agency_owner_invitations set accepted_at=now(),agency_id=agency_new where id=rec.id;
 return jsonb_build_object('agency_id',agency_new,'free_remaining',2);
end $$;

create or replace function public.agency_free_entitlements_status(agency_key uuid)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); result jsonb;
begin
 if actor is null or not (
  exists(select 1 from public.agency_members m where m.agency_id=agency_key and m.user_id=actor and m.active)
  or exists(select 1 from public.platform_memberships pm where pm.user_id=actor and pm.role='OWNER' and pm.active))
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 select jsonb_build_object('total',total,'used',used,'remaining',greatest(0,total-used))
 into result from public.agency_free_entitlements where agency_id=agency_key;
 return coalesce(result,jsonb_build_object('total',0,'used',0,'remaining',0,'not_configured',true));
end $$;

revoke all on function public.platform_invite_agency_owner(text,text,text,text) from public,anon,authenticated;
revoke all on function public.platform_agency_invitation_directory() from public,anon,authenticated;
revoke all on function public.platform_revoke_agency_owner_invitation(uuid) from public,anon,authenticated;
revoke all on function public.accept_agency_owner_invitation(text,text,text) from public,anon,authenticated;
revoke all on function public.agency_free_entitlements_status(uuid) from public,anon,authenticated;
grant execute on function public.platform_invite_agency_owner(text,text,text,text) to authenticated;
grant execute on function public.platform_agency_invitation_directory() to authenticated;
grant execute on function public.platform_revoke_agency_owner_invitation(uuid) to authenticated;
grant execute on function public.accept_agency_owner_invitation(text,text,text) to authenticated;
grant execute on function public.agency_free_entitlements_status(uuid) to authenticated;
