-- Agency owner contact and independent agency operator invitations.
-- Private tables: all access is via owner-scoped security-definer RPCs.
create table if not exists public.agency_owner_contacts (
 agency_id uuid not null,
 user_id uuid not null,
 first_name text not null check(char_length(btrim(first_name)) between 2 and 100),
 last_name text not null check(char_length(btrim(last_name)) between 2 and 100),
 phone text not null check(phone ~ '^\\+[1-9][0-9 ()-]{6,23}$'),
 email text not null check(email ~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' and char_length(email)<=254),
 updated_at timestamptz not null default now(),
 primary key (agency_id,user_id),
 foreign key (agency_id,user_id) references public.agency_members(agency_id,user_id) on delete cascade
);
alter table public.agency_owner_contacts enable row level security;
revoke all on public.agency_owner_contacts from public,anon,authenticated;

create table if not exists public.agency_operator_invites (
 id uuid primary key default gen_random_uuid(),
 agency_id uuid not null references public.agencies(id),
 invited_email text not null check (char_length(invited_email)<=254),
 token_hash text not null unique,
 created_by uuid not null references auth.users(id),
 is_demo boolean not null default false,
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default (now()+interval '7 days'),
 accepted_at timestamptz,
 revoked_at timestamptz
);
create index if not exists agency_operator_invites_lookup_idx on public.agency_operator_invites(agency_id,created_at desc);
alter table public.agency_operator_invites enable row level security;
revoke all on public.agency_operator_invites from public,anon,authenticated;

create or replace function app_private.can_manage_agency_team(agency_key uuid, context_key uuid)
returns boolean language sql stable security definer set search_path=''
as $$
select auth.uid() is not null and (
 exists(select 1 from public.agency_members am
   where am.agency_id=agency_key and am.user_id=auth.uid() and am.role='OWNER' and am.active)
 or (context_key is not null
  and exists(select 1 from public.platform_memberships pm
   where pm.user_id=auth.uid() and pm.role='OWNER' and pm.active)
  and exists(select 1 from public.platform_operator_contexts c
   where c.id=context_key and c.actor_id=auth.uid() and c.agency_id=agency_key
     and c.context_type='AGENCY' and c.closed_at is null and c.expires_at>now()))
)
$$;
revoke all on function app_private.can_manage_agency_team(uuid,uuid) from public,anon,authenticated;

create or replace function public.agency_team_snapshot(agency_key uuid, context_key uuid default null)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare response jsonb;
begin
 if not app_private.can_manage_agency_team(agency_key,context_key)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501'; end if;
 select jsonb_build_object(
  'agency_id',a.id,'agency_name',a.legal_name,
  'members',coalesce((
    select jsonb_agg(jsonb_build_object(
     'user_id',am.user_id,'role',am.role,'active',am.active,
     'display_name',coalesce(p.display_name,''),
     'login_email',coalesce(u.email,''),
     'first_name',coalesce(c.first_name,''),
     'last_name',coalesce(c.last_name,''),
     'phone',coalesce(c.phone,''),
     'contact_email',coalesce(c.email,''),
     'contact_complete',c.user_id is not null
    ) order by case when am.role='OWNER' then 0 else 1 end,coalesce(u.email,''))
    from public.agency_members am
    left join public.profiles p on p.user_id=am.user_id
    left join auth.users u on u.id=am.user_id
    left join public.agency_owner_contacts c on c.agency_id=am.agency_id and c.user_id=am.user_id
    where am.agency_id=a.id
   ),'[]'::jsonb),
  'invites',coalesce((
   select jsonb_agg(jsonb_build_object(
    'id',i.id,'email',i.invited_email,'created_at',i.created_at,
    'expires_at',i.expires_at,'accepted_at',i.accepted_at,'revoked_at',i.revoked_at
   ) order by i.created_at desc)
   from public.agency_operator_invites i where i.agency_id=a.id and i.accepted_at is null
   ),'[]'::jsonb)
 ) into response from public.agencies a where a.id=agency_key;
 if response is null then raise exception 'AGENCY_NOT_FOUND' using errcode='22023';end if;
 return response;
end $$;

create or replace function public.agency_save_owner_contact(
 agency_key uuid,owner_key uuid,first_name text,last_name text,phone text,email text,
 context_key uuid default null)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); result jsonb;
begin
 if not app_private.can_manage_agency_team(agency_key,context_key)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 if not exists(select 1 from public.agency_members am
    where am.agency_id=agency_key and am.user_id=owner_key and am.role='OWNER')
 then raise exception 'TARGET_NOT_OWNER' using errcode='22023';end if;
 -- An agency owner can only edit their own personal contact details. Contextual SuperAdmin can edit any owner.
 if actor<>owner_key and not (context_key is not null and exists(
  select 1 from public.platform_memberships pm where pm.user_id=actor and pm.role='OWNER' and pm.active))
 then raise exception 'CONTACT_OWNER_MISMATCH' using errcode='42501';end if;
 if first_name is null or last_name is null or phone is null or email is null or
    char_length(btrim(first_name)) not between 2 and 100 or
    char_length(btrim(last_name)) not between 2 and 100 or
    phone !~ '^\\+[1-9][0-9 ()-]{6,23}$' or
    email !~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' or char_length(email)>254
 then raise exception 'INVALID_OWNER_CONTACT' using errcode='22023';end if;
 insert into public.agency_owner_contacts(agency_id,user_id,first_name,last_name,phone,email)
 values(agency_key,owner_key,btrim(first_name),btrim(last_name),btrim(phone),lower(btrim(email)))
 on conflict(agency_id,user_id) do update set
 first_name=excluded.first_name,last_name=excluded.last_name,phone=excluded.phone,
 email=excluded.email,updated_at=now();
 return jsonb_build_object('saved',true);
end $$;

create or replace function public.agency_invite_operator(
 agency_key uuid,invited_email text, context_key uuid default null)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare email_normal text:=lower(btrim(coalesce(invited_email,'')));
 raw_token text; invite_id uuid; demo boolean;
begin
 if not app_private.can_manage_agency_team(agency_key,context_key)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 if char_length(email_normal)>254 or email_normal !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
 then raise exception 'INVALID_EMAIL' using errcode='22023';end if;
 if (select count(*) from public.agency_operator_invites i where i.agency_id=agency_key
    and i.accepted_at is null and i.revoked_at is null and i.expires_at>now())>=20
 then raise exception 'TOO_MANY_PENDING_INVITES' using errcode='22023';end if;
 if exists(select 1 from public.agency_members am
    join auth.users u on u.id=am.user_id
    where am.agency_id=agency_key and lower(u.email)=email_normal and am.active)
 then raise exception 'ALREADY_MEMBER' using errcode='22023';end if;
 select is_demo into demo from public.agencies where id=agency_key;
 if not found then raise exception 'AGENCY_NOT_FOUND' using errcode='22023';end if;
 update public.agency_operator_invites set revoked_at=now()
 where agency_id=agency_key and invited_email=email_normal
   and accepted_at is null and revoked_at is null;
 raw_token:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
 insert into public.agency_operator_invites(agency_id,invited_email,token_hash,created_by,is_demo)
 values(agency_key,email_normal,encode(sha256(convert_to(raw_token,'UTF8')),'hex'),auth.uid(),demo)
 returning id into invite_id;
 return jsonb_build_object('id',invite_id,'token',raw_token,'email',email_normal);
end $$;

create or replace function public.agency_accept_operator_invite(invitation_token text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); usr auth.users%rowtype; inv public.agency_operator_invites%rowtype; existing text; result jsonb;
begin
 if actor is null then raise exception 'SIGN_IN_REQUIRED' using errcode='42501';end if;
 select * into usr from auth.users where id=actor and email_confirmed_at is not null;
 if not found then raise exception 'VERIFIED_EMAIL_REQUIRED' using errcode='42501';end if;
 if invitation_token is null or invitation_token !~ '^[0-9a-f]{64}$'
 then raise exception 'INVALID_INVITATION' using errcode='22023';end if;
 select * into inv from public.agency_operator_invites
 where token_hash=encode(sha256(convert_to(invitation_token,'UTF8')),'hex')
 and accepted_at is null and revoked_at is null and expires_at>now() for update;
 if not found then raise exception 'INVITATION_EXPIRED_OR_INVALID' using errcode='22023';end if;
 if lower(usr.email)<>inv.invited_email
 then raise exception 'INVITATION_EMAIL_MISMATCH' using errcode='42501';end if;
 select role into existing from public.agency_members
 where agency_id=inv.agency_id and user_id=actor for update;
 if existing='OWNER' then raise exception 'ALREADY_OWNER' using errcode='22023';end if;
 insert into public.agency_members(agency_id,user_id,role,active,is_demo)
 values(inv.agency_id,actor,'OPERATOR',true,inv.is_demo)
 on conflict(agency_id,user_id) do update set active=true
 where agency_members.role='OPERATOR';
 update public.agency_operator_invites set accepted_at=now() where id=inv.id;
 select jsonb_build_object('success',true,'agency',a.legal_name) into result
 from public.agencies a where a.id=inv.agency_id;
 return result;
end $$;

create or replace function public.agency_set_operator_active(
 agency_key uuid, operator_key uuid, enabled boolean,context_key uuid default null)
returns jsonb language plpgsql security definer set search_path=''
as $$
begin
 if not app_private.can_manage_agency_team(agency_key,context_key)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 if enabled is null then raise exception 'INVALID_STATUS' using errcode='22023';end if;
 update public.agency_members set active=enabled
 where agency_id=agency_key and user_id=operator_key and role='OPERATOR';
 if not found then raise exception 'OPERATOR_NOT_FOUND' using errcode='22023';end if;
 return jsonb_build_object('success',true,'active',enabled);
end $$;

create or replace function public.agency_revoke_operator_invite(
 agency_key uuid,invite_key uuid,context_key uuid default null)
returns jsonb language plpgsql security definer set search_path=''
as $$
begin
 if not app_private.can_manage_agency_team(agency_key,context_key)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 update public.agency_operator_invites set revoked_at=now()
 where id=invite_key and agency_id=agency_key and accepted_at is null and revoked_at is null;
 if not found then raise exception 'INVITATION_NOT_FOUND' using errcode='22023';end if;
 return jsonb_build_object('success',true);
end $$;

do $$
declare signature text;
begin
 foreach signature in array array[
  'agency_team_snapshot(uuid,uuid)',
  'agency_save_owner_contact(uuid,uuid,text,text,text,text,uuid)',
  'agency_invite_operator(uuid,text,uuid)',
  'agency_accept_operator_invite(text)',
  'agency_set_operator_active(uuid,uuid,boolean,uuid)',
  'agency_revoke_operator_invite(uuid,uuid,uuid)'
 ] loop
  execute 'revoke all on function public.'||signature||' from public,anon,authenticated';
  execute 'grant execute on function public.'||signature||' to authenticated';
 end loop;
end $$;

-- Preserve global fixture reset behavior for DEMO-only owner contacts and invitations.
-- These tables have an empty original baseline. Leave real contacts/invites untouched.
