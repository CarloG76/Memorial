-- Public read-only projection: no private messages, family contact data, payment
-- or invitation tokens. Unlisted memorials require the unpredictable URL token.
create or replace function public.get_published_memorial_by_token(share_token text)
returns jsonb language sql stable security definer set search_path=''
as $$
 select jsonb_build_object(
  'memorial_id',m.id,'name',m.deceased_name,'birth_date',m.birth_date,'death_date',m.death_date,
  'tier',m.tier,'dedication',coalesce(p.dedication,''),'biography',coalesce(p.biography,''),
  'story',coalesce(p.story,''),'highlights',coalesce(p.highlights,'[]'::jsonb),
  'portrait_url',p.portrait_url,'portrait_focus_x',coalesce(p.portrait_focus_x,42),
  'background_preset',coalesce(v.published_preset,'montagna'),
  'background_url',coalesce(bg.image_url,default_bg.image_url),
  'photos',coalesce((select jsonb_agg(jsonb_build_object('title',i.title,'subtitle',i.subtitle,'image_url',i.image_url) order by i.position)
   from public.memorial_public_demo_photos i where i.memorial_id=m.id),'[]'::jsonb),
  'memories',coalesce((select jsonb_agg(jsonb_build_object('title',x.title,'body',x.body,'author',x.guest_author,'photo_path',x.photo_public_path) order by x.created_at desc)
   from public.memorial_memories x where x.memorial_id=m.id and x.moderation_status='APPROVED'),'[]'::jsonb),
  'thoughts',coalesce((select jsonb_agg(jsonb_build_object('author',x.author_name,'body',x.body) order by x.created_at desc)
   from public.memorial_thoughts x where x.memorial_id=m.id and x.moderation_status='APPROVED'),'[]'::jsonb),
  'is_demo',m.is_demo,'is_preview',false,'visibility',m.visibility
 )
 from public.memorials m
 left join public.memorial_public_demo_profiles p on p.memorial_id=m.id
 left join public.memorial_visual_settings v on v.memorial_id=m.id
 left join public.memorial_background_presets bg on bg.id=v.published_preset and bg.active
 left join public.memorial_background_presets default_bg on default_bg.id='montagna'
 where share_token~'^[0-9a-f]{48}$'
 and m.public_token=share_token
 and m.status='PUBLISHED_ACTIVE'
 and m.first_published_at is not null
 and m.covered_until>now()
 limit 1
$$;
revoke all on function public.get_published_memorial_by_token(text) from public,anon,authenticated;
grant execute on function public.get_published_memorial_by_token(text) to anon,authenticated;
