-- M2 SuperAdmin unified catalog: preference stored in PostgreSQL, not localStorage.
alter table public.profiles add column if not exists catalog_demo_filter text not null default 'ALL';
alter table public.profiles add constraint profiles_catalog_demo_filter_check
 check (catalog_demo_filter in ('ALL','ONLY_DEMO','NO_DEMO'));
grant update (catalog_demo_filter) on public.profiles to authenticated;
create policy profiles_self_update_preference on public.profiles
 for update to authenticated using (user_id=(select auth.uid()))
 with check (user_id=(select auth.uid()));
-- A platform OWNER alone may inspect memorial identity rows across tenants.
-- Other platform roles retain the existing narrow RLS restrictions.
create policy memorials_platform_owner_read on public.memorials
 for select to authenticated using (
 exists(select 1 from public.platform_memberships pm
 where pm.user_id=(select auth.uid()) and pm.active and pm.role='OWNER')
 );
