-- M1 WF01 candidate; not executed in the operational Supabase database.
-- Depends on 20261020190000_m1_identity_tenancy.sql.
create table public.agency_legal_documents (
 kind text not null check(kind in ('B2B_TERMS','PRIVACY_NOTICE')),
 version text not null check(length(btrim(version)) between 1 and 100),
 document_url text not null check(document_url ~ '^https://[^[:space:]]+$'),
 published_at timestamptz not null, active boolean not null default false,
 primary key(kind,version)
);
create unique index legal_one_active_version on public.agency_legal_documents(kind) where active;
alter table public.agencies add column plan text not null default 'FREE' check(plan in ('FREE','PRO'));
create unique index agency_country_vat_unique on public.agencies(country_code,vat_number) where vat_number is not null;
create table public.agency_registration_acceptances (
 agency_id uuid primary key references public.agencies(id),
 user_id uuid not null references auth.users(id),
 terms_kind text not null default 'B2B_TERMS' check(terms_kind='B2B_TERMS'),
 terms_version text not null,
 privacy_kind text not null default 'PRIVACY_NOTICE' check(privacy_kind='PRIVACY_NOTICE'),
 privacy_version text not null,
 accepted_at timestamptz not null default now(),
 foreign key(terms_kind,terms_version) references public.agency_legal_documents(kind,version),
 foreign key(privacy_kind,privacy_version) references public.agency_legal_documents(kind,version)
);
create function app_private.is_valid_it_vat(vat text)
returns boolean language plpgsql immutable set search_path=''
as $$
declare score integer:=0; digit integer;
begin
 if vat is null or vat !~ '^[0-9]{11}$' then return false; end if;
 for i in 1..10 loop
  digit:=substr(vat,i,1)::integer;
  if mod(i,2)=0 then
   digit:=digit*2;
   if digit>9 then digit:=digit-9; end if;
  end if;
  score:=score+digit;
 end loop;
 return mod(10-mod(score,10),10)=substr(vat,11,1)::integer;
end $$;
create function public.complete_agency_registration(
 p_legal_name text,p_vat_number text,p_terms_version text,p_privacy_version text
) returns uuid language plpgsql security definer set search_path=''
as $$
declare
 principal uuid:=auth.uid();
 confirmed_email text;
 agency_id uuid;
 legal_name text:=btrim(p_legal_name);
begin
 if principal is null then raise exception 'Verified login required'; end if;
 select u.email into confirmed_email from auth.users u
 where u.id=principal and u.email_confirmed_at is not null;
 if confirmed_email is null or confirmed_email='' then raise exception 'Verified email required'; end if;
 if legal_name is null or length(legal_name) not between 2 and 240
 or not app_private.is_valid_it_vat(p_vat_number) then
  raise exception 'Invalid agency data';
 end if;
 if not exists(select 1 from public.agency_legal_documents d
  where d.kind='B2B_TERMS' and d.version=p_terms_version
  and d.active and d.published_at<=now())
 or not exists(select 1 from public.agency_legal_documents d
  where d.kind='PRIVACY_NOTICE' and d.version=p_privacy_version
  and d.active and d.published_at<=now()) then
  raise exception 'Approved legal documents unavailable';
 end if;
 perform pg_advisory_xact_lock(hashtextextended('memorial:agency:'||p_vat_number,0));
 select a.id into agency_id from public.agencies a
 join public.agency_members m on m.agency_id=a.id
 where a.country_code='IT' and a.vat_number=p_vat_number
 and m.user_id=principal and m.role='OWNER' and m.active limit 1;
 if agency_id is not null then return agency_id; end if;
 insert into public.agencies(legal_name,vat_number,contact_email,country_code,plan)
 values(legal_name,p_vat_number,confirmed_email,'IT','FREE')
 returning id into agency_id;
 insert into public.agency_members(agency_id,user_id,role)
 values(agency_id,principal,'OWNER');
 insert into public.agency_registration_acceptances(agency_id,user_id,terms_version,privacy_version)
 values(agency_id,principal,p_terms_version,p_privacy_version);
 return agency_id;
end $$;
alter table public.agency_legal_documents enable row level security;
alter table public.agency_registration_acceptances enable row level security;
revoke all on public.agency_legal_documents,public.agency_registration_acceptances
 from public,anon,authenticated;
grant select on public.agency_legal_documents to authenticated;
create policy agency_legal_documents_read on public.agency_legal_documents
 for select to authenticated using(active and published_at<=now());
revoke all on function public.complete_agency_registration(text,text,text,text)
 from public,anon,authenticated;
grant execute on function public.complete_agency_registration(text,text,text,text) to authenticated;
revoke all on function app_private.is_valid_it_vat(text) from public,anon,authenticated;
