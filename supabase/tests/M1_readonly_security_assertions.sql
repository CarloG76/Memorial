-- Run ONLY after M1 migration in a disposable Supabase test database.
-- Checks catalogue properties; this does not replace cross-tenant login tests.
do $$
declare tab text;
begin
  foreach tab in array array[
    'profiles', 'platform_memberships', 'agencies', 'agency_members',
    'memorials', 'family_members', 'family_invites'
  ]
  loop
    if not exists (
      select 1 from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = tab and c.relrowsecurity
    ) then raise exception 'Missing RLS on public.%', tab; end if;

    if has_table_privilege('anon', format('public.%I', tab), 'SELECT')
      or has_table_privilege('anon', format('public.%I', tab), 'INSERT')
      or has_table_privilege('authenticated', format('public.%I', tab), 'INSERT')
      or has_table_privilege('authenticated', format('public.%I', tab), 'UPDATE')
      or has_table_privilege('authenticated', format('public.%I', tab), 'DELETE')
    then raise exception 'Unexpected direct privilege on public.%', tab; end if;
  end loop;

  if has_table_privilege('authenticated', 'public.family_invites', 'SELECT')
  then raise exception 'Invitation tokens/PII directly readable'; end if;

  if exists (select 1 from pg_policies p
    where p.schemaname='public' and p.tablename in
    ('profiles','platform_memberships','agencies','agency_members',
      'memorials','family_members','family_invites')
    and p.cmd <> 'SELECT'
  ) then raise exception 'Unexpected write policy in M1'; end if;

  if exists (select 1 from pg_policies p
    where p.schemaname='public' and p.tablename in
    ('profiles','platform_memberships','agencies','agency_members',
      'memorials','family_members','family_invites')
    and 'anon'=any(p.roles)
  ) then raise exception 'Anon RLS policy found'; end if;

  if exists (select 1 from information_schema.routines
    where routine_schema='public' and routine_name in
    ('in_agency','is_agency_owner','in_family','is_family_owner','can_manage_agencies')
  ) then raise exception 'Privileged helper exposed in public'; end if;
end $$;
