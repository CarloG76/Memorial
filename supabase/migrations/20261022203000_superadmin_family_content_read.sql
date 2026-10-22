-- Permit platform OWNER to inspect family relationships and moderated content.
-- Existing family-specific RLS remains unchanged, no anonymous or write access.
create policy family_members_platform_owner_select on public.family_members for select to authenticated
using (exists(select 1 from public.platform_memberships p where p.user_id=(select auth.uid()) and p.role='OWNER' and p.active));
create policy memorial_memories_platform_owner_select on public.memorial_memories for select to authenticated
using (exists(select 1 from public.platform_memberships p where p.user_id=(select auth.uid()) and p.role='OWNER' and p.active));
create policy memorial_thoughts_platform_owner_select on public.memorial_thoughts for select to authenticated
using (exists(select 1 from public.platform_memberships p where p.user_id=(select auth.uid()) and p.role='OWNER' and p.active));
create policy profiles_platform_owner_select on public.profiles for select to authenticated
using (exists(select 1 from public.platform_memberships p where p.user_id=(select auth.uid()) and p.role='OWNER' and p.active));
