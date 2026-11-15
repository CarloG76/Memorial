-- Real visitor-submitted memories with private image moderation.
alter table public.memorial_memories
 add column if not exists guest_author text,
 add column if not exists photo_private_path text,
 add column if not exists photo_public_path text,
 add column if not exists visitor_submitted boolean not null default false;
alter table public.memorial_memories
 drop constraint if exists guest_author_length;
alter table public.memorial_memories
 add constraint guest_author_length check(guest_author is null or char_length(btrim(guest_author)) between 2 and 100);
alter table public.memorial_memories
 drop constraint if exists visitor_memory_file_paths;
alter table public.memorial_memories
 add constraint visitor_memory_file_paths check (
  (photo_private_path is null or photo_private_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\\.(jpg|png|webp)$')
  and (photo_public_path is null or photo_public_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\\.(jpg|png|webp)$')
 );

-- Only backend Service Role uses the upload/private moderation buckets.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values
 ('memorial-pending','memorial-pending',false,5242880,array['image/jpeg','image/png','image/webp']::text[]),
 ('memorial-approved','memorial-approved',true,5242880,array['image/jpeg','image/png','image/webp']::text[])
on conflict(id) do nothing;

create table if not exists app_private.visitor_memories_rate_limit(
 rate_key text not null,
 submitted_on date not null default (now() at time zone 'utc')::date,
 total integer not null default 0,
 primary key(rate_key,submitted_on)
);
revoke all on app_private.visitor_memories_rate_limit from public,anon,authenticated;

create or replace function public.visitor_memory_allow(memorial_key uuid,ip_key text)
returns boolean language plpgsql security definer set search_path=''
as $$
declare ip_total integer; memorial_total integer; day_key date:=(now() at time zone 'utc')::date;
begin
 if auth.role() <> 'service_role' then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 if memorial_key is null or ip_key is null or length(ip_key)<>64 then return false;end if;
 if not exists(select 1 from public.memorials m where m.id=memorial_key and m.visibility='PUBLIC'
  and m.status='PUBLISHED_ACTIVE' and m.is_demo=true and m.tier='PREMIUM') then return false;end if;
 insert into app_private.visitor_memories_rate_limit(rate_key,submitted_on,total)
 values('ip:'||ip_key,day_key,1)
 on conflict(rate_key,submitted_on) do update set total=app_private.visitor_memories_rate_limit.total+1
 returning total into ip_total;
 insert into app_private.visitor_memories_rate_limit(rate_key,submitted_on,total)
 values('memorial:'||memorial_key::text,day_key,1)
 on conflict(rate_key,submitted_on) do update set total=app_private.visitor_memories_rate_limit.total+1
 returning total into memorial_total;
 return ip_total<=8 and memorial_total<=40;
end $$;
revoke all on function public.visitor_memory_allow(uuid,text) from public,anon,authenticated;
grant execute on function public.visitor_memory_allow(uuid,text) to service_role;

-- Published visitor images live in approved public bucket only after moderation.
create or replace function public.get_public_memorial_demo()
returns jsonb language sql stable security definer set search_path=''
as $$
select jsonb_build_object(
'name',m.deceased_name,'birth_date',m.birth_date,'death_date',m.death_date,'tier',m.tier,
'dedication',p.dedication,'biography',p.biography,'story',p.story,'highlights',p.highlights,
'portrait_url',p.portrait_url,'portrait_focus_x',p.portrait_focus_x,
'background_preset',coalesce(v.published_preset,'montagna'),'background_url',coalesce(bg.image_url,default_bg.image_url),
'photos',coalesce((select jsonb_agg(jsonb_build_object('title',i.title,'subtitle',i.subtitle,'image_url',i.image_url) order by i.position) from public.memorial_public_demo_photos i where i.memorial_id=m.id),'[]'::jsonb),
'memories',coalesce((select jsonb_agg(jsonb_build_object('title',x.title,'body',x.body,'author',x.guest_author,'photo_path',x.photo_public_path) order by x.created_at desc) from public.memorial_memories x where x.memorial_id=m.id and x.moderation_status='APPROVED'),'[]'::jsonb),
'thoughts',coalesce((select jsonb_agg(jsonb_build_object('author',x.author_name,'body',x.body) order by x.created_at desc) from public.memorial_thoughts x where x.memorial_id=m.id and x.moderation_status='APPROVED'),'[]'::jsonb),
'is_demo',m.is_demo)
from public.memorial_demo_slots s join public.memorials m on m.id=s.memorial_id
join public.memorial_public_demo_profiles p on p.memorial_id=m.id
left join public.memorial_visual_settings v on v.memorial_id=m.id
left join public.memorial_background_presets bg on bg.id=v.published_preset and bg.active
left join public.memorial_background_presets default_bg on default_bg.id='montagna'
where s.slot='visitor_preview' and m.is_demo=true and m.status='PUBLISHED_ACTIVE' and m.visibility='PUBLIC' limit 1
$$;
revoke all on function public.get_public_memorial_demo() from public,anon,authenticated;
grant execute on function public.get_public_memorial_demo() to anon,authenticated;
