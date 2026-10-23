-- MEMORIAL M2 / database-owned demo catalog — additive, reviewed against live M1 schema.
-- No mock records in TypeScript. No auth.users insertion and no real payments/emails.
-- Rows NOT marked is_demo are never modified by this migration.
alter table public.agencies add column if not exists is_demo boolean not null default false;
alter table public.agencies add column if not exists demo_code text;
alter table public.memorials add column if not exists is_demo boolean not null default false;
alter table public.memorials add column if not exists demo_code text;
alter table public.agency_members add column if not exists is_demo boolean not null default false;
alter table public.family_members add column if not exists is_demo boolean not null default false;
alter table public.family_invites add column if not exists is_demo boolean not null default false;
alter table public.profiles add column if not exists is_demo boolean not null default false;

alter table public.memorials add column if not exists tier text;
alter table public.memorials add column if not exists status text not null default 'DRAFT';
alter table public.memorials add column if not exists visibility text not null default 'UNLISTED';
alter table public.memorials add column if not exists deceased_name text;
alter table public.memorials add column if not exists birth_date date;
alter table public.memorials add column if not exists death_date date;
alter table public.memorials add column if not exists first_published_at timestamptz;
alter table public.memorials add column if not exists covered_until timestamptz;
alter table public.memorials add column if not exists public_token text;

alter table public.agencies add constraint agencies_demo_code_required
  check (not is_demo or (demo_code is not null and demo_code ~ '^A[0-9]{2}$'));
alter table public.memorials add constraint memorials_demo_code_required
  check (not is_demo or (demo_code is not null and demo_code ~ '^M[0-9]{2}$'));
alter table public.memorials add constraint memorials_tier_allowed
  check (tier is null or tier in ('STANDARD','PREMIUM'));
alter table public.memorials add constraint memorials_status_allowed
  check (status in ('DRAFT','PAYMENT_PENDING','SKELETON_ACTIVE','FAMILY_PREPARING',
    'READY_FOR_PUBLICATION','PUBLISHED_ACTIVE','PRESERVED_STATIC','EXPIRED',
    'UNPUBLISHED_ARCHIVED','ARCHIVED','CLOSED','SUSPENDED'));
alter table public.memorials add constraint memorials_visibility_allowed
  check (visibility in ('UNLISTED','PUBLIC'));
alter table public.memorials add constraint memorials_publication_requires_tier
  check (status not in ('PUBLISHED_ACTIVE','PRESERVED_STATIC') or tier is not null);
create unique index agencies_demo_code_unique on public.agencies(demo_code) where is_demo;
create unique index memorials_demo_code_unique on public.memorials(demo_code) where is_demo;
create unique index memorials_token_unique on public.memorials(public_token)
  where public_token is not null;
alter table public.agencies add constraint agencies_id_is_demo_unique unique (id,is_demo);
alter table public.memorials add constraint memorials_id_is_demo_unique unique (id,is_demo);
alter table public.memorials add constraint memorials_same_demo_as_agency
  foreign key(agency_id,is_demo) references public.agencies(id,is_demo);
alter table public.agency_members add constraint agency_member_same_demo
  foreign key(agency_id,is_demo) references public.agencies(id,is_demo);
alter table public.family_members add constraint family_member_same_demo
  foreign key(memorial_id,is_demo) references public.memorials(id,is_demo);
alter table public.family_invites add constraint family_invite_same_demo
  foreign key(memorial_id,is_demo) references public.memorials(id,is_demo);

-- Existing M1 RLS remains in force. SuperAdmin OWNER can inspect synthetic
-- memorials for QA; no general staff access to real memorial content.
create policy memorials_demo_owner_select on public.memorials
  for select to authenticated
  using (is_demo and exists (
    select 1 from public.platform_memberships pm
    where pm.user_id = (select auth.uid()) and pm.active and pm.role = 'OWNER'
  ));

-- Defensive defaults: direct anonymous access and mutations remain revoked.
revoke all on public.agencies, public.memorials from anon;
revoke insert, update, delete on public.agencies, public.memorials from authenticated;
comment on column public.agencies.is_demo is
  'True only for owned synthetic fixture data; exclude from real KPIs and billing.';
comment on column public.memorials.is_demo is
  'True only for synthetic fixture memorial; cannot reference a real agency.';
