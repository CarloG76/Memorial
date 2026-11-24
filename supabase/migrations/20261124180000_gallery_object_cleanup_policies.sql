-- Allow authorized users to remove gallery object bytes when removing a photo.
-- Public-read bucket is a known MVP privacy limitation: URLs should not be
-- described as access-controlled while public storage is used.
create policy memorial_gallery_authorized_select on storage.objects for select to authenticated
using(bucket_id='memorial-gallery' and exists(
 select 1 from public.memorials m where m.id=(split_part(name,'/',1))::uuid
 and (
 exists(select 1 from public.family_members f where f.memorial_id=m.id and f.user_id=auth.uid() and f.active and (f.role='OWNER' or (f.role='EDITOR' and f.can_edit_content)))
 or exists(select 1 from public.agency_members am where am.agency_id=m.agency_id and am.user_id=auth.uid() and am.active and am.role in ('OWNER','OPERATOR'))
 or exists(select 1 from public.platform_memberships p where p.user_id=auth.uid() and p.role='OWNER' and p.active)
 )));
create policy memorial_gallery_authorized_delete on storage.objects for delete to authenticated
using(bucket_id='memorial-gallery' and exists(
 select 1 from public.memorials m where m.id=(split_part(name,'/',1))::uuid
 and (
 exists(select 1 from public.family_members f where f.memorial_id=m.id and f.user_id=auth.uid() and f.active and (f.role='OWNER' or (f.role='EDITOR' and f.can_edit_content)))
 or exists(select 1 from public.agency_members am where am.agency_id=m.agency_id and am.user_id=auth.uid() and am.active and am.role in ('OWNER','OPERATOR'))
 or exists(select 1 from public.platform_memberships p where p.user_id=auth.uid() and p.role='OWNER' and p.active)
 )));
