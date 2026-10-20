-- MEMORIAL / M1 / Identity and tenancy
-- CANDIDATE MIGRATION — REVIEW AND TEST ON ISOLATED STAGING BEFORE APPLYING.
-- No data fixtures, real payment integration, owner privilege assignment or visitor PII.
-- Source: 01_DECISIONI.md, 05_RUOLI_PERMESSI.md, 09_ARCHITETTURA.md.
-- Migration deliberately creates no write policies for client sessions.

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.platform_memberships (
  user_id uuid not null references auth.users(id),
  role text not null check (role in ('OWNER','ADMIN','FINANCE','SUPPORT')),
  active boolean not null default true,
  granted_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

-- Governance: only one active SuperAdmin/PLATFORM_OWNER can exist.
-- Never provision or grant this role via client, seed or invitation.
create unique index platform_one_active_owner
  on public.platform_memberships (role)
  where role = 'OWNER' and active;

create table public.agencies (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null check (length(btrim(legal_name)) between 1 and 240),
  vat_number text,
  contact_email text,
  city text,
  country_code char(2) not null default 'IT',
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE','SUSPENDED','CLOSED')),
  created_at timestamptz not null default now()
);

create table public.agency_members (
  agency_id uuid not null references public.agencies(id),
  user_id uuid not null references auth.users(id),
  role text not null check (role in ('OWNER','OPERATOR')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (agency_id, user_id)
);

-- M1 contains only a minimal memorial identity row. M2 will add
-- product details, pricing, states and public access after validation.
-- In particular: no dates, PINs, body content or media in this milestone.
create table public.memorials (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id),
  created_at timestamptz not null default now()
);

create table public.family_members (
  memorial_id uuid not null references public.memorials(id),
  user_id uuid not null references auth.users(id),
  role text not null check (role in ('OWNER','EDITOR','VIEWER')),
  can_moderate boolean not null default false,
  can_edit_content boolean not null default false,
  can_view_contacts boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (memorial_id, user_id)
);

create table public.family_invites (
  id uuid primary key default gen_random_uuid(),
  memorial_id uuid not null references public.memorials(id),
  invited_email text not null,
  role text not null check (role in ('OWNER','EDITOR','VIEWER')),
  token_hash text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (accepted_at is null or revoked_at is null)
);

create index agency_members_by_user on public.agency_members(user_id, active);
create index family_members_by_user on public.family_members(user_id, active);
create index memorials_by_agency on public.memorials(agency_id);
create index family_invites_by_memorial on public.family_invites(memorial_id);

-- Non-exposed predicate functions. Arguments are resource IDs, never user IDs:
-- the current principal is always derived from auth.uid(), not request inputs.
-- Must NOT include app_private in Supabase Data API exposed schemas.
create function app_private.in_agency(p_agency_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $body$
  select exists (
    select 1 from public.agency_members m
    where m.agency_id = p_agency_id
      and m.user_id = (select auth.uid())
      and m.active
  );
$body$;

create function app_private.is_agency_owner(p_agency_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $body$
  select exists (
    select 1 from public.agency_members m
    where m.agency_id = p_agency_id
      and m.user_id = (select auth.uid())
      and m.active and m.role = 'OWNER'
  );
$body$;

create function app_private.in_family(p_memorial_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $body$
  select exists (
    select 1 from public.family_members m
    where m.memorial_id = p_memorial_id
      and m.user_id = (select auth.uid())
      and m.active
  );
$body$;

create function app_private.is_family_owner(p_memorial_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $body$
  select exists (
    select 1 from public.family_members m
    where m.memorial_id = p_memorial_id
      and m.user_id = (select auth.uid())
      and m.active and m.role = 'OWNER'
  );
$body$;

create function app_private.can_manage_agencies()
returns boolean language sql stable security definer set search_path = ''
as $body$
  select exists (
    select 1 from public.platform_memberships m
    where m.user_id = (select auth.uid())
      and m.active and m.role in ('OWNER','ADMIN')
  );
$body$;

revoke all on all functions in schema app_private from public, anon, authenticated;
grant usage on schema app_private to authenticated;
grant execute on function app_private.in_agency(uuid) to authenticated;
grant execute on function app_private.is_agency_owner(uuid) to authenticated;
grant execute on function app_private.in_family(uuid) to authenticated;
grant execute on function app_private.is_family_owner(uuid) to authenticated;
grant execute on function app_private.can_manage_agencies() to authenticated;

alter table public.profiles enable row level security;
alter table public.platform_memberships enable row level security;
alter table public.agencies enable row level security;
alter table public.agency_members enable row level security;
alter table public.memorials enable row level security;
alter table public.family_members enable row level security;
alter table public.family_invites enable row level security;

-- Explicitly prevent direct table mutations from anon/authenticated.
-- Privileged writes will use audited server workflows after M1 validation.
revoke all on public.profiles, public.platform_memberships,
  public.agencies, public.agency_members, public.memorials,
  public.family_members, public.family_invites
  from public, anon, authenticated;

grant select on public.profiles, public.platform_memberships,
  public.agencies, public.agency_members, public.memorials,
  public.family_members to authenticated;
-- Family invites are NEVER directly selected by browser/API roles.

create policy profiles_self_read on public.profiles
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy platform_memberships_self_read on public.platform_memberships
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Platform ADMIN may inspect the agency registry, not private family content.
create policy agencies_scoped_read on public.agencies
  for select to authenticated
  using (app_private.in_agency(id) or app_private.can_manage_agencies());

create policy agency_members_scoped_read on public.agency_members
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or app_private.is_agency_owner(agency_id)
    or app_private.can_manage_agencies()
  );

-- Deliberately excludes generic platform-staff read of all memorials.
create policy memorials_scoped_read on public.memorials
  for select to authenticated
  using (app_private.in_agency(agency_id) or app_private.in_family(id));

create policy family_members_scoped_read on public.family_members
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or app_private.is_family_owner(memorial_id)
  );

-- NO insert/update/delete RLS policies, NO anon selects, NO generic staff PII.
-- NO superadmin auto-assignment, NO auth.users creation, NO dummy reset.
