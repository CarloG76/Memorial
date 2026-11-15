-- YouTube embed reference only; never download/transcode/store copyrighted audio.
alter table public.memorial_public_demo_profiles add column if not exists music_video_id text null;
alter table public.memorial_public_demo_profiles drop constraint if exists memorial_music_video_id_format;
alter table public.memorial_public_demo_profiles add constraint memorial_music_video_id_format
 check (music_video_id is null or music_video_id ~ '^[A-Za-z0-9_-]{11}$');
-- Incorporate the new optional field into reset baseline without altering existing values.
update app_private.demo_reset_baseline set rows=(
 select coalesce(jsonb_agg(item || jsonb_build_object('music_video_id',null)),'[]'::jsonb)
 from jsonb_array_elements(rows) item)
where table_name='memorial_public_demo_profiles';

create or replace function public.memorial_music_get(target_memorial uuid, context_key uuid default null)
returns text language plpgsql stable security definer set search_path=''
as $$
declare actor uuid:=auth.uid();
begin
 if actor is null then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 if not exists(select 1 from public.memorials where id=target_memorial)
 then raise exception 'MEMORIAL_NOT_FOUND' using errcode='22023';end if;
 if not (
  exists(select 1 from public.platform_memberships pm where pm.user_id=actor and pm.role='OWNER' and pm.active and context_key is null)
  or exists(select 1 from public.family_members fm where fm.user_id=actor and fm.memorial_id=target_memorial and fm.active and (fm.role='OWNER' or (fm.role='EDITOR' and fm.can_edit_content)) and context_key is null)
  or exists(select 1 from public.platform_memberships pm join public.platform_operator_contexts c on c.actor_id=pm.user_id
    where pm.user_id=actor and pm.role='OWNER' and pm.active
    and c.id=context_key and c.memorial_id=target_memorial and c.context_type='FAMILY'
    and c.closed_at is null and c.expires_at>now())
 ) then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 return (select music_video_id from public.memorial_public_demo_profiles where memorial_id=target_memorial);
end $$;

create or replace function public.memorial_music_save(target_memorial uuid, video_id text, context_key uuid default null)
returns text language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); previous text; next_video text:=nullif(btrim(coalesce(video_id,'')),'');
begin
 if actor is null then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 if next_video is not null and next_video !~ '^[A-Za-z0-9_-]{11}$'
 then raise exception 'INVALID_YOUTUBE_ID' using errcode='22023';end if;
 if not exists(select 1 from public.memorials where id=target_memorial)
 then raise exception 'MEMORIAL_NOT_FOUND' using errcode='22023';end if;
 if not (
  exists(select 1 from public.platform_memberships pm where pm.user_id=actor and pm.role='OWNER' and pm.active and context_key is null)
  or exists(select 1 from public.family_members fm where fm.user_id=actor and fm.memorial_id=target_memorial and fm.active and (fm.role='OWNER' or (fm.role='EDITOR' and fm.can_edit_content)) and context_key is null)
  or exists(select 1 from public.platform_memberships pm join public.platform_operator_contexts c on c.actor_id=pm.user_id
    where pm.user_id=actor and pm.role='OWNER' and pm.active
    and c.id=context_key and c.memorial_id=target_memorial and c.context_type='FAMILY'
    and c.closed_at is null and c.expires_at>now())
 ) then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 select music_video_id into previous from public.memorial_public_demo_profiles where memorial_id=target_memorial for update;
 if not found then
  insert into public.memorial_public_demo_profiles(memorial_id,music_video_id)
  values(target_memorial,next_video);
 else
  update public.memorial_public_demo_profiles set music_video_id=next_video,updated_at=now() where memorial_id=target_memorial;
 end if;
 if previous is distinct from next_video then
  insert into public.memorial_presentation_audit(memorial_id,actor_id,action,old_values,new_values)
  values(target_memorial,actor,'MUSIC_YOUTUBE_UPDATED',jsonb_build_object('video_id',previous),jsonb_build_object('video_id',next_video));
 end if;
 return next_video;
end $$;

revoke all on function public.memorial_music_get(uuid,uuid) from public,anon,authenticated;
revoke all on function public.memorial_music_save(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.memorial_music_get(uuid,uuid) to authenticated;
grant execute on function public.memorial_music_save(uuid,text,uuid) to authenticated;

create or replace function public.get_public_memorial_demo()
returns jsonb language sql stable security definer set search_path=''
as $$
select jsonb_build_object(
'name',m.deceased_name,'birth_date',m.birth_date,'death_date',m.death_date,'tier',m.tier,
'dedication',p.dedication,'biography',p.biography,'music_video_id',p.music_video_id,'story',p.story,'highlights',p.highlights,
'portrait_url',p.portrait_url,'portrait_focus_x',p.portrait_focus_x,
'background_preset',coalesce(v.published_preset,'montagna'),'background_url',coalesce(bg.image_url,default_bg.image_url),
'photos',coalesce((select jsonb_agg(jsonb_build_object('title',i.title,'subtitle',i.subtitle,'image_url',i.image_url) order by i.position) from public.memorial_public_demo_photos i where i.memorial_id=m.id),'[]'::jsonb),
'memories',coalesce((select jsonb_agg(jsonb_build_object('title',x.title,'body',x.body) order by x.created_at desc) from public.memorial_memories x where x.memorial_id=m.id and x.moderation_status='APPROVED'),'[]'::jsonb),
'thoughts',coalesce((select jsonb_agg(jsonb_build_object('author',x.author_name,'body',x.body) order by x.created_at desc) from public.memorial_thoughts x where x.memorial_id=m.id and x.moderation_status='APPROVED'),'[]'::jsonb),
'is_demo',m.is_demo)
from public.memorial_demo_slots s join public.memorials m on m.id=s.memorial_id
join public.memorial_public_demo_profiles p on p.memorial_id=m.id
left join public.memorial_visual_settings v on v.memorial_id=m.id
left join public.memorial_background_presets bg on bg.id=v.published_preset and bg.active
left join public.memorial_background_presets default_bg on default_bg.id='montagna'
where s.slot='visitor_preview' and m.is_demo=true and m.status='PUBLISHED_ACTIVE' and m.visibility='PUBLIC' limit 1
$$;
