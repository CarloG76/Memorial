-- Family members may read portrait metadata for their own memorial only.
-- Public clients continue to receive only sanitized data through the public RPC.
grant select(memorial_id,portrait_url,portrait_focus_x) on public.memorial_public_demo_profiles to authenticated;
create policy family_portrait_metadata_read on public.memorial_public_demo_profiles
for select to authenticated using (
 exists(select 1 from public.family_members f
 where f.memorial_id=memorial_public_demo_profiles.memorial_id
 and f.user_id=(select auth.uid()) and f.active)
);
