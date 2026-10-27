-- Curated demonstrative family-album media, separate from actual personal uploads.
create table if not exists public.memorial_public_demo_photos(
 id uuid primary key default gen_random_uuid(),
 memorial_id uuid not null references public.memorials(id) on delete cascade,
 title text not null,
 subtitle text not null default '',
 image_url text not null check (image_url like 'https://images.unsplash.com/%'),
 position int not null default 0,
 unique(memorial_id,position)
);
alter table public.memorial_public_demo_photos enable row level security;
revoke all on public.memorial_public_demo_photos from public, anon, authenticated;
insert into public.memorial_public_demo_photos(memorial_id,title,subtitle,image_url,position)
select m.id,v.title,v.subtitle,v.image_url,v.position from public.memorials m
cross join (values
 ('Le nostre passeggiate','Una domenica tra i sentieri','https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=740&q=82',1),
 ('In montagna','I luoghi che ci piacevano','https://images.unsplash.com/photo-1500534623283-312aade485b7?w=740&q=82',2),
 ('I giorni insieme','I sorrisi e gli amici di sempre','https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=740&q=82',3),
 ('La casa dei ricordi','Le cose semplici di tutti i giorni','https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=740&q=82',4),
 ('Viaggiare insieme','Orizzonti che restano','https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=740&q=82',5),
 ('Il tramonto più bello','Ogni sera una storia da raccontare','https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=740&q=82',6)
) as v(title,subtitle,image_url,position)
where m.demo_code='M01' and m.is_demo=true
on conflict (memorial_id,position) do nothing;
create or replace function public.get_public_memorial_demo()
returns jsonb language sql stable security definer set search_path=''
as $$
 select jsonb_build_object(
  'name',m.deceased_name,'birth_date',m.birth_date,'death_date',m.death_date,
  'tier',m.tier,'dedication',p.dedication,'biography',p.biography,'highlights',p.highlights,
  'photos',coalesce((select jsonb_agg(jsonb_build_object('title',v.title,'subtitle',v.subtitle,'image_url',v.image_url) order by v.position)
     from public.memorial_public_demo_photos v where v.memorial_id=m.id),'[]'::jsonb),
  'memories',coalesce((select jsonb_agg(jsonb_build_object('title',x.title,'body',x.body) order by x.created_at desc)
     from public.memorial_memories x where x.memorial_id=m.id and x.moderation_status='APPROVED'),'[]'::jsonb),
  'thoughts',coalesce((select jsonb_agg(jsonb_build_object('author',x.author_name,'body',x.body) order by x.created_at desc)
     from public.memorial_thoughts x where x.memorial_id=m.id and x.moderation_status='APPROVED'),'[]'::jsonb),
  'is_demo',true)
 from public.memorials m join public.memorial_public_demo_profiles p on p.memorial_id=m.id
 where m.demo_code='M01' and m.is_demo=true and m.status='PUBLISHED_ACTIVE' and m.visibility='PUBLIC'
 limit 1
$$;
revoke all on function public.get_public_memorial_demo() from public;
grant execute on function public.get_public_memorial_demo() to anon,authenticated;
