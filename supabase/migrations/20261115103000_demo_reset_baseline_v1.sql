-- DEMO reset v1. Baseline captured once from live, never from preliminary legacy fixture.
-- Scope: 3 existing demo agencies / 12 existing memorials + 9 associated tables.
-- No auth users, storage objects, action logs or non-demo data are removed.
create schema if not exists app_private;
create table if not exists app_private.demo_reset_baseline(
 table_name text primary key, rows jsonb not null, captured_at timestamptz not null default now(),
 check (jsonb_typeof(rows)='array')
);
revoke all on app_private.demo_reset_baseline from public,anon,authenticated;
create table if not exists app_private.demo_reset_runs(
 id bigint generated always as identity primary key,
 actor_id uuid not null references auth.users(id),
 occurred_at timestamptz not null default now(),
 baseline_version text not null,
 restored_counts jsonb not null
);
revoke all on app_private.demo_reset_runs from public,anon,authenticated;

insert into app_private.demo_reset_baseline(table_name,rows)
 select 'agencies',coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
 from public.agencies t where t.is_demo = true
 on conflict (table_name) do nothing;
insert into app_private.demo_reset_baseline(table_name,rows)
 select 'memorials',coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
 from public.memorials t where t.is_demo = true
 on conflict (table_name) do nothing;
insert into app_private.demo_reset_baseline(table_name,rows)
 select 'agency_members',coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
 from public.agency_members t where t.is_demo = true and exists(select 1 from public.agencies a where a.id=t.agency_id and a.is_demo)
 on conflict (table_name) do nothing;
insert into app_private.demo_reset_baseline(table_name,rows)
 select 'family_members',coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
 from public.family_members t where t.is_demo = true and exists(select 1 from public.memorials m where m.id=t.memorial_id and m.is_demo)
 on conflict (table_name) do nothing;
insert into app_private.demo_reset_baseline(table_name,rows)
 select 'family_invites',coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
 from public.family_invites t where t.is_demo = true and exists(select 1 from public.memorials m where m.id=t.memorial_id and m.is_demo)
 on conflict (table_name) do nothing;
insert into app_private.demo_reset_baseline(table_name,rows)
 select 'memorial_memories',coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
 from public.memorial_memories t where t.is_demo = true and exists(select 1 from public.memorials m where m.id=t.memorial_id and m.is_demo)
 on conflict (table_name) do nothing;
insert into app_private.demo_reset_baseline(table_name,rows)
 select 'memorial_thoughts',coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
 from public.memorial_thoughts t where t.is_demo = true and exists(select 1 from public.memorials m where m.id=t.memorial_id and m.is_demo)
 on conflict (table_name) do nothing;
insert into app_private.demo_reset_baseline(table_name,rows)
 select 'memorial_public_demo_profiles',coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
 from public.memorial_public_demo_profiles t where exists(select 1 from public.memorials m where m.id=t.memorial_id and m.is_demo)
 on conflict (table_name) do nothing;
insert into app_private.demo_reset_baseline(table_name,rows)
 select 'memorial_public_demo_photos',coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
 from public.memorial_public_demo_photos t where exists(select 1 from public.memorials m where m.id=t.memorial_id and m.is_demo)
 on conflict (table_name) do nothing;
insert into app_private.demo_reset_baseline(table_name,rows)
 select 'memorial_visual_settings',coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
 from public.memorial_visual_settings t where exists(select 1 from public.memorials m where m.id=t.memorial_id and m.is_demo)
 on conflict (table_name) do nothing;
insert into app_private.demo_reset_baseline(table_name,rows)
 select 'memorial_demo_slots',coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
 from public.memorial_demo_slots t where exists(select 1 from public.memorials m where m.id=t.memorial_id and m.is_demo)
 on conflict (table_name) do nothing;

do $$
begin
 if (select jsonb_array_length(rows) from app_private.demo_reset_baseline where table_name='agencies') <> 3
 or (select jsonb_array_length(rows) from app_private.demo_reset_baseline where table_name='memorials') <> 12
 then raise exception 'UNEXPECTED_DEMO_BASELINE_COUNTS';end if;
end $$;

create or replace function public.platform_demo_reset_preview()
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare actor uuid := auth.uid(); baseline jsonb; current_counts jsonb;
begin
 if actor is null or not exists(select 1 from public.platform_memberships where user_id=actor and role='OWNER' and active)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 select jsonb_object_agg(table_name,jsonb_array_length(rows)) into baseline
 from app_private.demo_reset_baseline;
 select jsonb_build_object(
  'agencies',(select count(*) from public.agencies where is_demo),
  'memorials',(select count(*) from public.memorials where is_demo),
  'memories',(select count(*) from public.memorial_memories where is_demo),
  'thoughts',(select count(*) from public.memorial_thoughts where is_demo),
  'photos',(select count(*) from public.memorial_public_demo_photos p join public.memorials m on m.id=p.memorial_id where m.is_demo)
 ) into current_counts;
 return jsonb_build_object('version','baseline-2026-11-15','baseline',baseline,'current',current_counts,
  'limitations','Non elimina account Auth, audit, asset Storage esterni; nuove agenzie/memoriali DEMO richiedono estensione della baseline.');
end $$;
revoke all on function public.platform_demo_reset_preview() from public,anon,authenticated;
grant execute on function public.platform_demo_reset_preview() to authenticated;

create or replace function public.platform_reset_demo_data(confirmation text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); t text; pk text; updates text; ct integer;
 result jsonb:='{}'::jsonb; baseline_agency_ids uuid[];baseline_memorial_ids uuid[];
begin
 if actor is null or not exists(select 1 from public.platform_memberships where user_id=actor and role='OWNER' and active)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 if confirmation is distinct from 'RESET DEMO DATA'
 then raise exception 'CONFIRMATION_REQUIRED' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtext('memorial_demo_reset_v1'));
 select array_agg((item->>'id')::uuid order by item->>'id') into baseline_agency_ids
 from app_private.demo_reset_baseline b cross join lateral jsonb_array_elements(b.rows) item where b.table_name='agencies';
 select array_agg((item->>'id')::uuid order by item->>'id') into baseline_memorial_ids
 from app_private.demo_reset_baseline b cross join lateral jsonb_array_elements(b.rows) item where b.table_name='memorials';
 if (select array_agg(id order by id) from public.agencies where is_demo) is distinct from baseline_agency_ids
 or (select array_agg(id order by id) from public.memorials where is_demo) is distinct from baseline_memorial_ids
 then raise exception 'DEMO_ID_SET_CHANGED: reset blocked; new demo agencies/memorials require baseline review';end if;
 -- Never touch any non-demo association; abort rather than alter it.
 if exists(select 1 from public.agency_members where agency_id=any(baseline_agency_ids) and not is_demo)
 or exists(select 1 from public.family_members where memorial_id=any(baseline_memorial_ids) and not is_demo)
 or exists(select 1 from public.family_invites where memorial_id=any(baseline_memorial_ids) and not is_demo)
 or exists(select 1 from public.memorial_memories where memorial_id=any(baseline_memorial_ids) and not is_demo)
 or exists(select 1 from public.memorial_thoughts where memorial_id=any(baseline_memorial_ids) and not is_demo)
 then raise exception 'NON_DEMO_ASSOCIATION_FOUND';end if;
 -- Restore the existing baseline identity and scalar fields, preserving FK stable IDs.
 for t in select unnest(array['agencies','memorials']) loop
  select string_agg(format('%I',k.column_name),',' order by k.ordinal_position) into pk
  from information_schema.table_constraints c join information_schema.key_column_usage k
  on c.constraint_name=k.constraint_name and c.table_schema=k.table_schema
  where c.table_schema='public' and c.table_name=t and c.constraint_type='PRIMARY KEY';
  select string_agg(format('%I=excluded.%I',c.column_name,c.column_name),',') into updates
  from information_schema.columns c where c.table_schema='public' and c.table_name=t and c.column_name<>'id';
  execute format('insert into public.%I select (jsonb_populate_record(null::public.%I, x.row)).* from app_private.demo_reset_baseline b cross join lateral jsonb_array_elements(b.rows) x(row) where b.table_name=%L on conflict (%s) do update set %s',t,t,t,pk,updates);
  get diagnostics ct=row_count; result:=result||jsonb_build_object(t,ct);
 end loop;
 -- Delete all demo-dependent mutable content, including newly added contributions.
 delete from public.family_invites where memorial_id=any(baseline_memorial_ids) and is_demo;
 delete from public.memorial_thoughts where memorial_id=any(baseline_memorial_ids) and is_demo;
 delete from public.memorial_memories where memorial_id=any(baseline_memorial_ids) and is_demo;
 delete from public.memorial_public_demo_photos where memorial_id=any(baseline_memorial_ids);
 delete from public.memorial_public_demo_profiles where memorial_id=any(baseline_memorial_ids);
 delete from public.memorial_visual_settings where memorial_id=any(baseline_memorial_ids);
 delete from public.memorial_demo_slots where memorial_id=any(baseline_memorial_ids);
 delete from public.family_members where memorial_id=any(baseline_memorial_ids) and is_demo;
 delete from public.agency_members where agency_id=any(baseline_agency_ids) and is_demo;
 -- The following list is a reviewed allowlist, not an arbitrary client-supplied table.
 for t in select unnest(array['agency_members','family_members','family_invites',
 'memorial_public_demo_profiles','memorial_public_demo_photos','memorial_visual_settings',
 'memorial_demo_slots','memorial_memories','memorial_thoughts']) loop
  select string_agg(format('%I',k.column_name),',' order by k.ordinal_position) into pk
  from information_schema.table_constraints c join information_schema.key_column_usage k
  on c.constraint_name=k.constraint_name and c.table_schema=k.table_schema
  where c.table_schema='public' and c.table_name=t and c.constraint_type='PRIMARY KEY';
  select string_agg(format('%I=excluded.%I',c.column_name,c.column_name),',') into updates
  from information_schema.columns c
  where c.table_schema='public' and c.table_name=t and c.column_name not in (
    select k.column_name from information_schema.table_constraints c2
    join information_schema.key_column_usage k on c2.constraint_name=k.constraint_name and c2.table_schema=k.table_schema
    where c2.table_schema='public' and c2.table_name=t and c2.constraint_type='PRIMARY KEY'
  );
  execute format('insert into public.%I select (jsonb_populate_record(null::public.%I,x.row)).* from app_private.demo_reset_baseline b cross join lateral jsonb_array_elements(b.rows) x(row) where b.table_name=%L on conflict (%s) do update set %s',t,t,t,pk,updates);
  get diagnostics ct=row_count;result:=result||jsonb_build_object(t,ct);
 end loop;
 insert into app_private.demo_reset_runs(actor_id,baseline_version,restored_counts)
 values(actor,'baseline-2026-11-15',result);
 return jsonb_build_object('success',true,'version','baseline-2026-11-15','restored',result);
end $$;
revoke all on function public.platform_reset_demo_data(text) from public,anon,authenticated;
grant execute on function public.platform_reset_demo_data(text) to authenticated;
