-- Ephemeral PostgreSQL 17 ONLY: minimum Supabase shape to exercise the MVP0
-- portrait authorization migration. Run after M1_auth_harness.sql.
create schema storage;
create table storage.objects (
 id uuid primary key default gen_random_uuid(),
 bucket_id text not null,
 name text not null unique
);
alter table storage.objects enable row level security;

create table public.agencies(id uuid primary key);
create table public.memorials(
 id uuid primary key,
 agency_id uuid not null references public.agencies(id)
);
create table public.family_members(
 memorial_id uuid references public.memorials(id),
 user_id uuid references auth.users(id),
 active boolean not null,
 role text not null,
 can_edit_content boolean not null default false
);
create table public.platform_memberships(
 user_id uuid references auth.users(id),
 active boolean not null,
 role text not null
);
create table public.agency_members(
 agency_id uuid references public.agencies(id),
 user_id uuid references auth.users(id),
 active boolean not null,
 role text not null
);
create table public.agency_family_operator_contexts(
 id uuid primary key,
 actor_id uuid references auth.users(id),
 agency_id uuid references public.agencies(id),
 memorial_id uuid references public.memorials(id),
 closed_at timestamptz,
 expires_at timestamptz not null
);
create table public.memorial_public_demo_profiles(
 memorial_id uuid primary key references public.memorials(id),
 dedication text not null,
 biography text not null,
 story text not null,
 highlights jsonb not null,
 portrait_url text,
 updated_at timestamptz default now()
);
create table public.agency_family_operator_events(
 id bigint generated always as identity primary key,
 context_id uuid references public.agency_family_operator_contexts(id),
 actor_id uuid references auth.users(id),
 action text not null,
 memorial_id uuid references public.memorials(id),
 data jsonb not null,
 at timestamptz not null default now()
);
-- This stub enforces the same AGENCY_AS_FAMILY actor + context invariants as
-- the real memorial_publication_actor_type. Never deploy this stub.
create function public.memorial_publication_actor_type(target_memorial uuid,context_key uuid)
returns text language plpgsql stable security definer set search_path=''
as $$
begin
 if exists(
  select 1 from public.agency_family_operator_contexts c
  join public.memorials m on m.id=c.memorial_id and m.agency_id=c.agency_id
  join public.agency_members a on a.user_id=c.actor_id and a.agency_id=c.agency_id
  where c.id=context_key and c.memorial_id=target_memorial
   and c.actor_id=auth.uid() and c.closed_at is null and c.expires_at>now()
   and a.active and a.role in ('OWNER','OPERATOR')
 ) then return 'AGENCY_AS_FAMILY';end if;
 raise exception 'NOT_AUTHORIZED' using errcode='42501';
end $$;

insert into auth.users(id,email_confirmed_at) values
 ('11111111-1111-4111-8111-111111111111',now()), -- agency operator
 ('22222222-2222-4222-8222-222222222222',now()), -- family owner
 ('33333333-3333-4333-8333-333333333333',now()); -- platform owner
insert into public.agencies(id) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
insert into public.memorials(id,agency_id) values
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
 ('dddddddd-dddd-4ddd-8ddd-dddddddddddd','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
insert into public.agency_members(agency_id,user_id,active,role)
 values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111',true,'OPERATOR');
insert into public.family_members(memorial_id,user_id,active,role,can_edit_content)
 values('cccccccc-cccc-4ccc-8ccc-cccccccccccc','22222222-2222-4222-8222-222222222222',true,'OWNER',true);
insert into public.platform_memberships(user_id,active,role)
 values('33333333-3333-4333-8333-333333333333',true,'OWNER');
insert into public.agency_family_operator_contexts(id,actor_id,agency_id,memorial_id,expires_at)
 values('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','11111111-1111-4111-8111-111111111111',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','cccccccc-cccc-4ccc-8ccc-cccccccccccc',now()+interval '2 hours');
insert into storage.objects(bucket_id,name) values
 ('memorial-portraits','cccccccc-cccc-4ccc-8ccc-cccccccccccc/ffffffff-ffff-4fff-8fff-ffffffffffff.jpg');

-- The original public portrait upload policy must exist to exercise replacement.
create policy "authorized_memorial_portrait_upload" on storage.objects
 for insert to authenticated with check (true);
