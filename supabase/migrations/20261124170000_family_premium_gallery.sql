-- Family-managed Premium gallery. All write operations require active membership or
-- an explicit, unexpired as-Family context. No direct table DML is granted.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('memorial-gallery','memorial-gallery',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy memorial_gallery_authorized_upload on storage.objects for insert to authenticated
with check(
 bucket_id='memorial-gallery'
 and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}[.](jpg|png|webp)$'
 and exists(select 1 from public.memorials m where m.id=(split_part(name,'/',1))::uuid
 and m.tier='PREMIUM' and (
 exists(select 1 from public.family_members fm where fm.memorial_id=m.id and fm.user_id=auth.uid() and fm.active
 and (fm.role='OWNER' or (fm.role='EDITOR' and fm.can_edit_content)))
 or exists(select 1 from public.agency_members am where am.agency_id=m.agency_id and am.user_id=auth.uid() and am.active and am.role in ('OWNER','OPERATOR'))
 or exists(select 1 from public.platform_memberships pm where pm.user_id=auth.uid() and pm.role='OWNER' and pm.active)
 )));
create or replace function public.family_gallery_check_actor(target_memorial uuid,context_key uuid)
returns text language plpgsql stable security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); tier_name text;
begin
 select m.tier into tier_name from public.memorials m where m.id=target_memorial;
 if tier_name is null then raise exception 'MEMORIAL_NOT_FOUND' using errcode='22023';end if;
 if tier_name<>'PREMIUM' then raise exception 'PREMIUM_REQUIRED' using errcode='42501';end if;
 if context_key is null and exists(select 1 from public.family_members f
 where f.user_id=actor and f.memorial_id=target_memorial and f.active
 and (f.role='OWNER' or (f.role='EDITOR' and f.can_edit_content)))
 then return 'FAMILY';end if;
 return public.memorial_publication_actor_type(target_memorial,context_key);
end $$;

create or replace function public.family_gallery_list(target_memorial uuid,context_key uuid default null)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare items jsonb;
begin
 perform public.family_gallery_check_actor(target_memorial,context_key);
 select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'title',p.title,'subtitle',p.subtitle,'image_url',p.image_url,'position',p.position) order by p.position,p.id),'[]'::jsonb)
 into items from public.memorial_public_demo_photos p where p.memorial_id=target_memorial;
 return items;
end $$;

create or replace function public.family_gallery_save(target_memorial uuid,context_key uuid,photo_id uuid,photo_title text,photo_subtitle text,photo_key text,photo_position integer)
returns uuid language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); actor_kind text; old_row jsonb; new_row jsonb; result_id uuid; url text;
begin
 actor_kind:=public.family_gallery_check_actor(target_memorial,context_key);
 if length(btrim(coalesce(photo_title,'')))<2 or length(photo_title)>120 or length(coalesce(photo_subtitle,''))>350
 or photo_position not between 1 and 99 or photo_key is null
 or photo_key !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}[.](jpg|png|webp)$'
 or split_part(photo_key,'/',1)<>target_memorial::text
 or not exists(select 1 from storage.objects o where o.bucket_id='memorial-gallery' and o.name=photo_key)
 then raise exception 'INVALID_GALLERY_PHOTO' using errcode='22023';end if;
 url:='/storage/v1/object/public/memorial-gallery/'||photo_key;
 if photo_id is not null then
   select to_jsonb(p) into old_row from public.memorial_public_demo_photos p where p.id=photo_id and p.memorial_id=target_memorial for update;
   if old_row is null then raise exception 'PHOTO_NOT_FOUND' using errcode='22023';end if;
   update public.memorial_public_demo_photos set title=btrim(photo_title),subtitle=coalesce(photo_subtitle,''),image_url=url,position=photo_position where id=photo_id returning id into result_id;
 else
   insert into public.memorial_public_demo_photos(memorial_id,title,subtitle,image_url,position)
   values(target_memorial,btrim(photo_title),coalesce(photo_subtitle,''),url,photo_position) returning id into result_id;
 end if;
 select to_jsonb(p) into new_row from public.memorial_public_demo_photos p where p.id=result_id;
 insert into public.memorial_presentation_audit(memorial_id,actor_id,action,old_values,new_values)
 values(target_memorial,actor,'FAMILY_GALLERY_SAVED',coalesce(old_row,'{}'::jsonb),new_row);
 if actor_kind='AGENCY_AS_FAMILY' then
  insert into public.agency_family_operator_events(context_id,actor_id,action,memorial_id,data)
  values(context_key,actor,'FAMILY_GALLERY_SAVED',target_memorial,jsonb_build_object('photo_id',result_id));
 elsif actor_kind='SUPERADMIN_AS_FAMILY' then
  insert into public.platform_operator_context_events(context_id,actor_id,event_type,target_type,target_id,after_data)
  values(context_key,actor,'FAMILY_GALLERY_SAVED','MEMORIAL',target_memorial,jsonb_build_object('photo_id',result_id));
 end if;
 return result_id;
end $$;

create or replace function public.family_gallery_delete(target_memorial uuid,context_key uuid,photo_id uuid)
returns boolean language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); actor_kind text; before_row jsonb;
begin
 actor_kind:=public.family_gallery_check_actor(target_memorial,context_key);
 delete from public.memorial_public_demo_photos p where p.id=photo_id and p.memorial_id=target_memorial returning to_jsonb(p) into before_row;
 if before_row is null then raise exception 'PHOTO_NOT_FOUND' using errcode='22023';end if;
 insert into public.memorial_presentation_audit(memorial_id,actor_id,action,old_values,new_values)
 values(target_memorial,actor,'FAMILY_GALLERY_DELETED',before_row,'{}'::jsonb);
 if actor_kind='AGENCY_AS_FAMILY' then
  insert into public.agency_family_operator_events(context_id,actor_id,action,memorial_id,data)
  values(context_key,actor,'FAMILY_GALLERY_DELETED',target_memorial,jsonb_build_object('photo_id',photo_id));
 elsif actor_kind='SUPERADMIN_AS_FAMILY' then
  insert into public.platform_operator_context_events(context_id,actor_id,event_type,target_type,target_id,after_data)
  values(context_key,actor,'FAMILY_GALLERY_DELETED','MEMORIAL',target_memorial,jsonb_build_object('photo_id',photo_id));
 end if;
 return true;
end $$;
revoke all on function public.family_gallery_check_actor(uuid,uuid),public.family_gallery_list(uuid,uuid),public.family_gallery_save(uuid,uuid,uuid,text,text,text,integer),public.family_gallery_delete(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.family_gallery_list(uuid,uuid),public.family_gallery_save(uuid,uuid,uuid,text,text,text,integer),public.family_gallery_delete(uuid,uuid,uuid) to authenticated;