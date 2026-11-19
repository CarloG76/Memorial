create or replace function public.get_authorized_memorial_preview(target_memorial uuid,context_key uuid default null)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); payload jsonb;
begin
 if actor is null or target_memorial is null then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 if not exists(select 1 from public.memorials m where m.id=target_memorial and (
   (context_key is null and (
     exists(select 1 from public.family_members fm where fm.memorial_id=m.id and fm.user_id=actor and fm.active)
     or exists(select 1 from public.agency_members am where am.agency_id=m.agency_id and am.user_id=actor and am.active)
     or exists(select 1 from public.platform_memberships pm where pm.user_id=actor and pm.role='OWNER' and pm.active)
   ))
   or (context_key is not null and exists(
    select 1 from public.platform_operator_contexts ctx
    join public.platform_memberships pm on pm.user_id=ctx.actor_id
    where ctx.id=context_key and ctx.actor_id=actor and pm.role='OWNER' and pm.active
    and ctx.closed_at is null and ctx.expires_at>now()
    and ((ctx.context_type='FAMILY' and ctx.memorial_id=m.id)
     or (ctx.context_type='AGENCY' and ctx.agency_id=m.agency_id))
   ))
 )) then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 select jsonb_build_object(
  'memorial_id',m.id,'name',m.deceased_name,'birth_date',m.birth_date,'death_date',m.death_date,'tier',m.tier,
  'dedication',coalesce(p.dedication,''),'biography',coalesce(p.biography,''),'story',coalesce(p.story,''),
  'highlights',coalesce(p.highlights,'[]'::jsonb),
  'portrait_url',p.portrait_url,'portrait_focus_x',coalesce(p.portrait_focus_x,42),
  'background_preset',coalesce(v.published_preset,'montagna'),
  'background_url',coalesce(bg.image_url,default_bg.image_url),
  'photos',coalesce((select jsonb_agg(jsonb_build_object('title',i.title,'subtitle',i.subtitle,'image_url',i.image_url) order by i.position)
   from public.memorial_public_demo_photos i where i.memorial_id=m.id),'[]'::jsonb),
  'memories',coalesce((select jsonb_agg(jsonb_build_object('title',x.title,'body',x.body,'author',x.guest_author,'photo_path',x.photo_public_path) order by x.created_at desc)
   from public.memorial_memories x where x.memorial_id=m.id and x.moderation_status='APPROVED'),'[]'::jsonb),
  'thoughts',coalesce((select jsonb_agg(jsonb_build_object('author',x.author_name,'body',x.body) order by x.created_at desc)
   from public.memorial_thoughts x where x.memorial_id=m.id and x.moderation_status='APPROVED'),'[]'::jsonb),
  'is_demo',m.is_demo,'is_preview',true,'status',m.status,'visibility',m.visibility)
 into payload
 from public.memorials m
 left join public.memorial_public_demo_profiles p on p.memorial_id=m.id
 left join public.memorial_visual_settings v on v.memorial_id=m.id
 left join public.memorial_background_presets bg on bg.id=v.published_preset and bg.active
 left join public.memorial_background_presets default_bg on default_bg.id='montagna'
 where m.id=target_memorial;
 return payload;
end $$;
revoke all on function public.get_authorized_memorial_preview(uuid,uuid) from public,anon,authenticated;
grant execute on function public.get_authorized_memorial_preview(uuid,uuid) to authenticated;
