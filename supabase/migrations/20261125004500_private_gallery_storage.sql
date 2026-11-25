-- Gallery is private by default; anonymous visitors may download only images
-- explicitly attached to a PUBLISHED_ACTIVE memorial under current coverage.
-- File names are random; unpublished images do not have any anon SELECT grants.
update storage.buckets set public=false where id='memorial-gallery';
drop policy if exists memorial_gallery_authorized_select on storage.objects;
create policy memorial_gallery_controlled_read on storage.objects
for select to authenticated,anon
using (
 bucket_id='memorial-gallery'
 and (
   exists (
    select 1 from public.memorials m
    where m.id=(split_part(name,'/',1))::uuid
    and m.status='PUBLISHED_ACTIVE'
    and m.first_published_at is not null and m.covered_until>now()
    and exists(select 1 from public.memorial_public_demo_photos p where p.memorial_id=m.id and p.image_url='/storage/v1/object/public/memorial-gallery/'||name)
   )
   or exists (
    select 1 from public.memorials m
    where m.id=(split_part(name,'/',1))::uuid
    and (
      exists(select 1 from public.family_members f where f.memorial_id=m.id and f.user_id=auth.uid() and f.active and (f.role='OWNER' or (f.role='EDITOR' and f.can_edit_content)))
      or exists(select 1 from public.agency_members a where a.agency_id=m.agency_id and a.user_id=auth.uid() and a.active and a.role in ('OWNER','OPERATOR'))
      or exists(select 1 from public.platform_memberships p where p.user_id=auth.uid() and p.role='OWNER' and p.active)
    )
   )
 )
);
