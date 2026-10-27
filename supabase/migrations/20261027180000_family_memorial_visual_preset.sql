-- Only family editors configure a draft; only a family OWNER may publish it.
-- Public visitor never receives drafts, private storage paths, or pending content.
create table if not exists public.memorial_visual_settings(
  memorial_id uuid primary key references public.memorials(id) on delete cascade,
  published_preset text not null default 'montagna' check(published_preset in ('montagna','prato','mare','lago','bosco','collina','cielo')),
  draft_preset text not null default 'montagna' check(draft_preset in ('montagna','prato','mare','lago','bosco','collina','cielo')),
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  published_by uuid references auth.users(id),
  published_at timestamptz
);
alter table public.memorial_visual_settings enable row level security;
revoke all on public.memorial_visual_settings from public,anon,authenticated;
grant select on public.memorial_visual_settings to authenticated;
create policy family_visual_settings_read on public.memorial_visual_settings for select to authenticated
using (exists(select 1 from public.family_members f where f.memorial_id=memorial_visual_settings.memorial_id and f.user_id=(select auth.uid()) and f.active));
create table if not exists public.memorial_visual_audit(
 id bigint generated always as identity primary key,
 memorial_id uuid not null references public.memorials(id) on delete cascade,
 actor_id uuid not null,
 action text not null check(action in ('DRAFT_CHANGED','PUBLISHED')),
 previous_preset text,
 new_preset text not null,
 happened_at timestamptz not null default now()
);
alter table public.memorial_visual_audit enable row level security;
revoke all on public.memorial_visual_audit from public,anon,authenticated;
create or replace function public.save_memorial_background_draft(target_memorial uuid, chosen_preset text)
returns text language plpgsql security definer set search_path=''
as $$
declare current_user_id uuid:=auth.uid(); previous text;
begin
 if current_user_id is null then raise exception 'NOT_AUTHENTICATED' using errcode='42501'; end if;
 if chosen_preset is null or chosen_preset not in ('montagna','prato','mare','lago','bosco','collina','cielo')
 then raise exception 'INVALID_PRESET' using errcode='22023'; end if;
 if not exists(select 1 from public.family_members f where f.memorial_id=target_memorial and f.user_id=current_user_id and f.active and (f.role='OWNER' or (f.role='EDITOR' and f.can_edit_content)))
 then raise exception 'NOT_AUTHORIZED' using errcode='42501'; end if;
 select draft_preset into previous from public.memorial_visual_settings where memorial_id=target_memorial for update;
 insert into public.memorial_visual_settings(memorial_id,draft_preset,updated_by,updated_at)
 values(target_memorial,chosen_preset,current_user_id,now())
 on conflict(memorial_id) do update set draft_preset=excluded.draft_preset,updated_by=excluded.updated_by,updated_at=excluded.updated_at;
 insert into public.memorial_visual_audit(memorial_id,actor_id,action,previous_preset,new_preset)
 values(target_memorial,current_user_id,'DRAFT_CHANGED',coalesce(previous,'montagna'),chosen_preset);
 return chosen_preset;
end $$;
create or replace function public.publish_memorial_background(target_memorial uuid)
returns text language plpgsql security definer set search_path=''
as $$
declare current_user_id uuid:=auth.uid(); old_preset text; new_preset text;
begin
 if current_user_id is null then raise exception 'NOT_AUTHENTICATED' using errcode='42501'; end if;
 if not exists(select 1 from public.family_members f where f.memorial_id=target_memorial and f.user_id=current_user_id and f.active and f.role='OWNER')
 then raise exception 'NOT_AUTHORIZED' using errcode='42501'; end if;
 if not exists(select 1 from public.memorials m where m.id=target_memorial and m.status='PUBLISHED_ACTIVE')
 then raise exception 'MEMORIAL_NOT_PUBLISHED' using errcode='22023'; end if;
 insert into public.memorial_visual_settings(memorial_id,updated_by) values(target_memorial,current_user_id)
 on conflict(memorial_id) do nothing;
 select published_preset,draft_preset into old_preset,new_preset from public.memorial_visual_settings where memorial_id=target_memorial for update;
 update public.memorial_visual_settings
 set published_preset=new_preset,published_by=current_user_id,published_at=now()
 where memorial_id=target_memorial;
 insert into public.memorial_visual_audit(memorial_id,actor_id,action,previous_preset,new_preset)
 values(target_memorial,current_user_id,'PUBLISHED',old_preset,new_preset);
 return new_preset;
end $$;
revoke all on function public.save_memorial_background_draft(uuid,text) from public;
revoke all on function public.publish_memorial_background(uuid) from public;
grant execute on function public.save_memorial_background_draft(uuid,text) to authenticated;
grant execute on function public.publish_memorial_background(uuid) to authenticated;
-- sanitized published presentation of the synthetic M01 only
create or replace function public.get_public_memorial_demo()
returns jsonb language sql stable security definer set search_path=''
as $$
 select jsonb_build_object(
  'name',m.deceased_name,'birth_date',m.birth_date,'death_date',m.death_date,
  'tier',m.tier,'dedication',p.dedication,'biography',p.biography,'highlights',p.highlights,
  'background_preset',coalesce((select v.published_preset from public.memorial_visual_settings v where v.memorial_id=m.id),'montagna'),
  'photos',coalesce((select jsonb_agg(jsonb_build_object('title',v.title,'subtitle',v.subtitle,'image_url',v.image_url) order by v.position) from public.memorial_public_demo_photos v where v.memorial_id=m.id),'[]'::jsonb),
  'memories',coalesce((select jsonb_agg(jsonb_build_object('title',x.title,'body',x.body) order by x.created_at desc) from public.memorial_memories x where x.memorial_id=m.id and x.moderation_status='APPROVED'),'[]'::jsonb),
  'thoughts',coalesce((select jsonb_agg(jsonb_build_object('author',x.author_name,'body',x.body) order by x.created_at desc) from public.memorial_thoughts x where x.memorial_id=m.id and x.moderation_status='APPROVED'),'[]'::jsonb),
  'is_demo',true)
 from public.memorials m join public.memorial_public_demo_profiles p on p.memorial_id=m.id
 where m.demo_code='M01' and m.is_demo=true and m.status='PUBLISHED_ACTIVE' and m.visibility='PUBLIC'
 limit 1
$$;
revoke all on function public.get_public_memorial_demo() from public;
grant execute on function public.get_public_memorial_demo() to anon,authenticated;
