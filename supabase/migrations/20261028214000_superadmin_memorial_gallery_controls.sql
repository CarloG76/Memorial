
-- SuperAdmin controls the public presentation, gallery and approved scenery, including demo.
alter table public.memorial_public_demo_photos drop constraint if exists memorial_public_demo_photos_image_url_check;
alter table public.memorial_public_demo_photos add constraint memorial_gallery_safe_image_url
check(image_url ~ '^/images/[A-Za-z0-9._-]+[.]((png)|(jpg)|(jpeg)|(webp))$' or image_url ~ '^https://images[.]unsplash[.]com/');
create or replace function public.platform_override_memorial_background(target_memorial uuid,chosen_preset text,reason text)
returns text language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); old text;
begin
 if actor is null or not exists(select 1 from public.platform_memberships p where p.user_id=actor and p.role='OWNER' and p.active)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501'; end if;
 if length(btrim(coalesce(reason,'')))<8 or not exists(select 1 from public.memorial_background_presets where id=chosen_preset and active)
 then raise exception 'INVALID_INPUT' using errcode='22023'; end if;
 if not exists(select 1 from public.memorials where id=target_memorial) then raise exception 'NOT_FOUND' using errcode='22023';end if;
 insert into public.memorial_visual_settings(memorial_id,updated_by) values(target_memorial,actor)
 on conflict(memorial_id) do nothing;
 select published_preset into old from public.memorial_visual_settings where memorial_id=target_memorial for update;
 update public.memorial_visual_settings set published_preset=chosen_preset,draft_preset=chosen_preset,published_by=actor,published_at=now(),updated_by=actor,updated_at=now() where memorial_id=target_memorial;
 if old is distinct from chosen_preset then
  insert into public.memorial_presentation_audit(memorial_id,actor_id,action,old_values,new_values)
  values(target_memorial,actor,'BACKGROUND_OVERRIDE: '||left(reason,500),jsonb_build_object('preset',old),jsonb_build_object('preset',chosen_preset));
 end if;
 return chosen_preset;
end $$;
revoke all on function public.platform_override_memorial_background(uuid,text,text) from public,anon,authenticated;
grant execute on function public.platform_override_memorial_background(uuid,text,text) to authenticated;

create or replace function public.platform_upsert_memorial_gallery_photo(target_memorial uuid,photo_id uuid,photo_title text,photo_subtitle text,photo_url text,photo_position integer,reason text)
returns uuid language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); original jsonb; changed jsonb; result uuid;
begin
 if actor is null or not exists(select 1 from public.platform_memberships p where p.user_id=actor and p.role='OWNER' and p.active)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501'; end if;
 if not exists(select 1 from public.memorials where id=target_memorial) then raise exception 'NOT_FOUND' using errcode='22023'; end if;
 if length(btrim(coalesce(reason,'')))<8 or length(btrim(coalesce(photo_title,'')))<2 or length(photo_title)>120
 or length(coalesce(photo_subtitle,''))>350 or photo_position not between 1 and 99
 or not(photo_url ~ '^/images/[A-Za-z0-9._-]+[.]((png)|(jpg)|(jpeg)|(webp))$' or photo_url ~ '^https://images[.]unsplash[.]com/')
 then raise exception 'INVALID_INPUT' using errcode='22023'; end if;
 if photo_id is not null then
  select to_jsonb(p) into original from public.memorial_public_demo_photos p where p.id=photo_id and p.memorial_id=target_memorial for update;
  if original is null then raise exception 'PHOTO_NOT_FOUND' using errcode='22023'; end if;
  update public.memorial_public_demo_photos set title=photo_title,subtitle=coalesce(photo_subtitle,''),image_url=photo_url,position=photo_position where id=photo_id returning id into result;
 else
  insert into public.memorial_public_demo_photos(memorial_id,title,subtitle,image_url,position)
  values(target_memorial,photo_title,coalesce(photo_subtitle,''),photo_url,photo_position)
  returning id into result;
 end if;
 select to_jsonb(p) into changed from public.memorial_public_demo_photos p where p.id=result;
 insert into public.memorial_presentation_audit(memorial_id,actor_id,action,old_values,new_values)
 values(target_memorial,actor,'GALLERY_UPDATED: '||left(reason,500),coalesce(original,'{}'::jsonb),changed);
 return result;
end $$;
revoke all on function public.platform_upsert_memorial_gallery_photo(uuid,uuid,text,text,text,integer,text) from public,anon,authenticated;
grant execute on function public.platform_upsert_memorial_gallery_photo(uuid,uuid,text,text,text,integer,text) to authenticated;

create or replace function public.platform_delete_memorial_gallery_photo(target_memorial uuid,photo_id uuid,reason text)
returns boolean language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); original jsonb;
begin
 if actor is null or not exists(select 1 from public.platform_memberships p where p.user_id=actor and p.role='OWNER' and p.active)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501'; end if;
 if length(btrim(coalesce(reason,'')))<8 then raise exception 'INVALID_REASON' using errcode='22023';end if;
 delete from public.memorial_public_demo_photos p where p.id=photo_id and p.memorial_id=target_memorial returning to_jsonb(p) into original;
 if original is null then raise exception 'PHOTO_NOT_FOUND' using errcode='22023';end if;
 insert into public.memorial_presentation_audit(memorial_id,actor_id,action,old_values,new_values)
 values(target_memorial,actor,'GALLERY_DELETED: '||left(reason,500),original,'{}'::jsonb);
 return true;
end $$;
revoke all on function public.platform_delete_memorial_gallery_photo(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.platform_delete_memorial_gallery_photo(uuid,uuid,text) to authenticated;

create or replace function public.platform_get_memorial_presentation(target_memorial uuid)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare result jsonb;
begin
 if not exists(select 1 from public.platform_memberships pm where pm.user_id=auth.uid() and pm.role='OWNER' and pm.active)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501'; end if;
 select jsonb_build_object(
 'memorial_id',m.id,'name',m.deceased_name,'tier',m.tier,'status',m.status,'is_demo',m.is_demo,
 'dedication',coalesce(p.dedication,''),'biography',coalesce(p.biography,''),
 'portrait_url',coalesce(p.portrait_url,''),'portrait_focus_x',coalesce(p.portrait_focus_x,42),
 'background',coalesce(v.published_preset,'montagna'),
 'presets',coalesce((select jsonb_agg(jsonb_build_object('id',x.id,'label',x.label,'image_url',x.image_url) order by x.sort_order)
 from public.memorial_background_presets x where x.active),'[]'::jsonb),
 'photos',coalesce((select jsonb_agg(jsonb_build_object('id',x.id,'title',x.title,'subtitle',x.subtitle,'image_url',x.image_url,'position',x.position) order by x.position)
 from public.memorial_public_demo_photos x where x.memorial_id=m.id),'[]'::jsonb),
 'history',coalesce((select jsonb_agg(jsonb_build_object('actor',h.actor,'action',h.action,'before',h.old_values,'after',h.new_values,'at',h.at_time) order by h.at_time desc)
 from (
  select a.actor_id as actor,a.action,a.old_values,a.new_values,a.changed_at as at_time
  from public.memorial_presentation_audit a where a.memorial_id=m.id
  union all
  select a.actor_id,a.action,jsonb_build_object('preset',a.previous_preset),jsonb_build_object('preset',a.new_preset),a.happened_at
  from public.memorial_visual_audit a where a.memorial_id=m.id
 ) h),'[]'::jsonb))
 into result from public.memorials m
 left join public.memorial_public_demo_profiles p on p.memorial_id=m.id
 left join public.memorial_visual_settings v on v.memorial_id=m.id where m.id=target_memorial;
 return result;
end $$;
revoke all on function public.platform_get_memorial_presentation(uuid) from public,anon,authenticated;
grant execute on function public.platform_get_memorial_presentation(uuid) to authenticated;
