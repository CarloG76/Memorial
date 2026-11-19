-- Allow authorized family and agency users to store a deceased person's portrait.
-- Storage holds binaries; profile record stores a per-memorial object URL.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('memorial-portraits','memorial-portraits',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "authorized_memorial_portrait_upload" on storage.objects;
create policy "authorized_memorial_portrait_upload" on storage.objects
for insert to authenticated
with check (
 bucket_id='memorial-portraits'
 and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}[.](jpg|png|webp)$'
 and exists(
 select 1 from public.memorials m where m.id=(split_part(name,'/',1))::uuid
 and (
 exists(select 1 from public.family_members fm where fm.memorial_id=m.id and fm.user_id=auth.uid()
  and fm.active and (fm.role='OWNER' or (fm.role='EDITOR' and fm.can_edit_content)))
 or exists(select 1 from public.agency_members am where am.agency_id=m.agency_id and am.user_id=auth.uid() and am.active)
 or exists(select 1 from public.platform_memberships pm where pm.user_id=auth.uid() and pm.role='OWNER' and pm.active)
 ))
);

create or replace function public.set_memorial_portrait(memorial_key uuid, object_key text)
returns text language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); agency_key uuid; path text;
begin
 if actor is null then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 select agency_id into agency_key from public.memorials where id=memorial_key for update;
 if agency_key is null then raise exception 'MEMORIAL_NOT_FOUND' using errcode='22023';end if;
 if not(
  exists(select 1 from public.family_members fm where fm.memorial_id=memorial_key and fm.user_id=actor
   and fm.active and (fm.role='OWNER' or (fm.role='EDITOR' and fm.can_edit_content)))
  or exists(select 1 from public.agency_members am where am.agency_id=agency_key and am.user_id=actor and am.active)
  or exists(select 1 from public.platform_memberships pm where pm.user_id=actor and pm.role='OWNER' and pm.active)
 ) then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 if object_key !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}[.](jpg|png|webp)$'
 or split_part(object_key,'/',1)<>memorial_key::text
 or not exists(select 1 from storage.objects where bucket_id='memorial-portraits' and name=object_key)
 then raise exception 'INVALID_PORTRAIT_OBJECT' using errcode='22023';end if;
 path:='/storage/v1/object/public/memorial-portraits/'||object_key;
 insert into public.memorial_public_demo_profiles(memorial_id,dedication,biography,story,highlights,portrait_url)
 values(memorial_key,'','','','[]'::jsonb,path)
 on conflict(memorial_id) do update set portrait_url=excluded.portrait_url,updated_at=now();
 return path;
end $$;
revoke all on function public.set_memorial_portrait(uuid,text) from public,anon,authenticated;
grant execute on function public.set_memorial_portrait(uuid,text) to authenticated;

-- Existing editorial APIs accept only locally hosted images. Include the exact
-- stored portrait path, without allowing arbitrary external URLs.
