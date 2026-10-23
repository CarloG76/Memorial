-- M2: memory stories and guestbook contributions; all persisted in PostgreSQL.
-- Additive; never send messages or make payments.
create table public.memorial_memories (
 id uuid primary key default gen_random_uuid(),
 memorial_id uuid not null references public.memorials(id),
 is_demo boolean not null default false,
 title text not null check (char_length(btrim(title)) between 2 and 180),
 body text not null check (char_length(btrim(body)) between 10 and 10000),
 moderation_status text not null default 'PENDING'
  check (moderation_status in ('PENDING','APPROVED','REJECTED')),
 created_at timestamptz not null default now(),
 constraint memory_same_demo foreign key (memorial_id,is_demo)
  references public.memorials(id,is_demo)
);
create table public.memorial_thoughts (
 id uuid primary key default gen_random_uuid(),
 memorial_id uuid not null references public.memorials(id),
 is_demo boolean not null default false,
 author_name text not null check (char_length(btrim(author_name)) between 2 and 80),
 body text not null check (char_length(btrim(body)) between 10 and 2000),
 moderation_status text not null default 'PENDING'
  check (moderation_status in ('PENDING','APPROVED','REJECTED')),
 created_at timestamptz not null default now(),
 constraint thought_same_demo foreign key (memorial_id,is_demo)
  references public.memorials(id,is_demo)
);
create index memorial_memories_by_memorial on public.memorial_memories (memorial_id, moderation_status);
create index memorial_thoughts_by_memorial on public.memorial_thoughts (memorial_id, moderation_status);
alter table public.memorial_memories enable row level security;
alter table public.memorial_thoughts enable row level security;
revoke all on public.memorial_memories, public.memorial_thoughts from public, anon, authenticated;
grant select on public.memorial_memories, public.memorial_thoughts to authenticated;
-- A family owner/editor can see pending records for their assigned memorial.
-- Agency staff and other memorial families cannot see guestbook data.
create policy family_memories_read on public.memorial_memories
 for select to authenticated using (app_private.in_family(memorial_id));
create policy family_thoughts_read on public.memorial_thoughts
 for select to authenticated using (app_private.in_family(memorial_id));
-- Direct writes deliberately disabled until actor-scoped moderation RPC is approved.
-- Static visitor publication projection will be implemented separately after privacy review.
