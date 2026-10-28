
create table if not exists public.memorial_background_presets(
 id text primary key,label text not null,image_url text not null,sort_order int not null,active boolean not null default true
);
alter table public.memorial_background_presets enable row level security;
revoke all on public.memorial_background_presets from public,anon;
grant select on public.memorial_background_presets to authenticated;
create policy memorial_preset_read on public.memorial_background_presets for select to authenticated using (active);
insert into public.memorial_background_presets(id,label,image_url,sort_order) values
('montagna','Montagna','https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1800&q=85',10),
('prato','Prato','https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1800&q=85',20),
('mare','Mare','https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1800&q=85',30),
('lago','Lago','https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1800&q=85',40),
('bosco','Bosco','https://images.unsplash.com/photo-1448375240586-882707db888b?w=1800&q=85',50),
('collina','Collina','https://images.unsplash.com/photo-1500534623283-312aade485b7?w=1800&q=85',60),
('cielo','Cielo','https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1800&q=85',70)
on conflict(id) do nothing;
alter table public.memorial_public_demo_profiles
 add column if not exists portrait_url text,
 add column if not exists portrait_focus_x smallint not null default 42 check(portrait_focus_x between 0 and 100);
create table if not exists public.memorial_presentation_audit(
 id bigint generated always as identity primary key,
 memorial_id uuid not null references public.memorials(id),
 actor_id uuid not null,
 action text not null,
 old_values jsonb not null,
 new_values jsonb not null,
 changed_at timestamptz not null default now()
);
create index if not exists memorial_presentation_audit_lookup on public.memorial_presentation_audit(memorial_id,changed_at desc);
alter table public.memorial_presentation_audit enable row level security;
revoke all on public.memorial_presentation_audit from public,anon,authenticated;
create table if not exists public.memorial_demo_slots(slot text primary key,memorial_id uuid not null references public.memorials(id));
alter table public.memorial_demo_slots enable row level security;
revoke all on public.memorial_demo_slots from public,anon,authenticated;
insert into public.memorial_demo_slots(slot,memorial_id)
 select 'visitor_preview',id from public.memorials where demo_code='M01' and is_demo=true on conflict(slot) do nothing;

create or replace function public.get_public_memorial_demo()
returns jsonb language sql stable security definer set search_path=''
as $$
select jsonb_build_object(
'name',m.deceased_name,'birth_date',m.birth_date,'death_date',m.death_date,'tier',m.tier,
'dedication',p.dedication,'biography',p.biography,'highlights',p.highlights,
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
revoke all on function public.get_public_memorial_demo() from public,anon,authenticated;
grant execute on function public.get_public_memorial_demo() to anon,authenticated;

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
'history',coalesce((select jsonb_agg(jsonb_build_object('actor',a.actor_id,'action',a.action,'before',a.old_values,'after',a.new_values,'at',a.changed_at) order by a.changed_at desc)
from (select * from public.memorial_presentation_audit where memorial_id=m.id order by changed_at desc limit 100) a),'[]'::jsonb))
into result
from public.memorials m left join public.memorial_public_demo_profiles p on p.memorial_id=m.id
left join public.memorial_visual_settings v on v.memorial_id=m.id
where m.id=target_memorial;
return result;
end $$;
revoke all on function public.platform_get_memorial_presentation(uuid) from public,anon,authenticated;
grant execute on function public.platform_get_memorial_presentation(uuid) to authenticated;

create or replace function public.platform_update_memorial_presentation(target_memorial uuid, changes jsonb, reason text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); old_row jsonb; new_row jsonb;
nm text; ded text; bio text; img text; focus_x integer;
begin
if actor is null or not exists(select 1 from public.platform_memberships pm where pm.user_id=actor and pm.role='OWNER' and pm.active)
then raise exception 'NOT_AUTHORIZED' using errcode='42501'; end if;
if target_memorial is null or changes is null or jsonb_typeof(changes)<>'object' or length(btrim(coalesce(reason,'')))<8 or length(reason)>500
then raise exception 'INVALID_CHANGE' using errcode='22023'; end if;
if exists(select 1 from jsonb_object_keys(changes) k where k not in ('name','dedication','biography','portrait_url','portrait_focus_x'))
then raise exception 'UNSUPPORTED_FIELD' using errcode='22023'; end if;
select jsonb_build_object('name',m.deceased_name,'dedication',p.dedication,'biography',p.biography,
'portrait_url',p.portrait_url,'portrait_focus_x',p.portrait_focus_x)
into old_row from public.memorials m left join public.memorial_public_demo_profiles p on p.memorial_id=m.id
where m.id=target_memorial for update of m;
if old_row is null then raise exception 'MEMORIAL_NOT_FOUND' using errcode='22023'; end if;
nm:=coalesce(changes->>'name',old_row->>'name');ded:=coalesce(changes->>'dedication',old_row->>'dedication','');
bio:=coalesce(changes->>'biography',old_row->>'biography','');
img:=coalesce(changes->>'portrait_url',old_row->>'portrait_url','');
focus_x:=coalesce((changes->>'portrait_focus_x')::integer,(old_row->>'portrait_focus_x')::integer,42);
if length(btrim(nm))<3 or length(nm)>180 or length(ded)>500 or length(bio)>8000 or focus_x not between 0 and 100
or (img<>'' and img !~ '^/images/[A-Za-z0-9._-]+[.]((png)|(jpg)|(jpeg)|(webp))$')
then raise exception 'INVALID_PRESENTATION' using errcode='22023'; end if;
update public.memorials set deceased_name=nm where id=target_memorial;
insert into public.memorial_public_demo_profiles(memorial_id,dedication,biography,portrait_url,portrait_focus_x)
values(target_memorial,ded,bio,nullif(img,''),focus_x)
on conflict(memorial_id) do update set dedication=excluded.dedication,biography=excluded.biography,
portrait_url=excluded.portrait_url,portrait_focus_x=excluded.portrait_focus_x,updated_at=now();
new_row:=jsonb_build_object('name',nm,'dedication',ded,'biography',bio,'portrait_url',nullif(img,''),'portrait_focus_x',focus_x);
if old_row is distinct from new_row then insert into public.memorial_presentation_audit(memorial_id,actor_id,action,old_values,new_values)
values(target_memorial,actor,'PRESENTATION_UPDATED: '||left(reason,500),old_row,new_row); end if;
return new_row;
end $$;
revoke all on function public.platform_update_memorial_presentation(uuid,jsonb,text) from public,anon,authenticated;
grant execute on function public.platform_update_memorial_presentation(uuid,jsonb,text) to authenticated;
