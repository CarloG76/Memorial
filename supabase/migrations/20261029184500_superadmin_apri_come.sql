-- SuperAdmin contextual views: explicit actor, target, short-lived session and audited commands.
-- No impersonation: all reads/writes resolve auth.uid() as PLATFORM_OWNER.
create table if not exists public.platform_operator_contexts (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id),
  context_type text not null check (context_type in ('AGENCY','FAMILY')),
  agency_id uuid references public.agencies(id),
  memorial_id uuid references public.memorials(id),
  started_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '2 hours'),
  closed_at timestamptz,
  check ((context_type='AGENCY' and agency_id is not null and memorial_id is null)
   or (context_type='FAMILY' and memorial_id is not null and agency_id is null))
);
create index if not exists platform_operator_contexts_actor_idx on public.platform_operator_contexts(actor_id,started_at desc);
alter table public.platform_operator_contexts enable row level security;
revoke all on public.platform_operator_contexts from public,anon,authenticated;

create table if not exists public.platform_operator_context_events (
  id bigint generated always as identity primary key,
  context_id uuid not null references public.platform_operator_contexts(id),
  actor_id uuid not null references auth.users(id),
  event_type text not null,
  target_type text not null,
  target_id uuid not null,
  reason text,
  before_data jsonb,
  after_data jsonb,
  occurred_at timestamptz not null default now()
);
create index if not exists platform_operator_context_events_idx on public.platform_operator_context_events(context_id,occurred_at desc);
alter table public.platform_operator_context_events enable row level security;
revoke all on public.platform_operator_context_events from public,anon,authenticated;

create or replace function public.platform_start_operator_context(kind text,target_id uuid)
returns uuid language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); cid uuid;
begin
 if actor is null or not exists(select 1 from public.platform_memberships p where p.user_id=actor and p.role='OWNER' and p.active)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 if kind='AGENCY' and exists(select 1 from public.agencies where id=target_id) then
   insert into public.platform_operator_contexts(actor_id,context_type,agency_id)
   values(actor,'AGENCY',target_id) returning id into cid;
 elsif kind='FAMILY' and exists(select 1 from public.memorials where id=target_id) then
   insert into public.platform_operator_contexts(actor_id,context_type,memorial_id)
   values(actor,'FAMILY',target_id) returning id into cid;
 else raise exception 'INVALID_CONTEXT' using errcode='22023';end if;
 insert into public.platform_operator_context_events(context_id,actor_id,event_type,target_type,target_id)
 values(cid,actor,'VIEW_STARTED',kind,target_id);
 return cid;
end $$;

-- Every contextual read uses the session's bound target. No arbitrary target in the URL can
-- widen access, and no tenant membership is inserted or modified.
create or replace function public.platform_get_operator_context(context_key uuid)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); ctx public.platform_operator_contexts%rowtype; result jsonb;
begin
 if actor is null or not exists(select 1 from public.platform_memberships p where p.user_id=actor and p.role='OWNER' and p.active)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 select * into ctx from public.platform_operator_contexts c
 where c.id=context_key and c.actor_id=actor and c.closed_at is null and c.expires_at>now();
 if not found then raise exception 'CONTEXT_EXPIRED_OR_DENIED' using errcode='42501';end if;
 if ctx.context_type='AGENCY' then
 select jsonb_build_object(
  'context_id',ctx.id,'kind','AGENCY','expires_at',ctx.expires_at,
  'agency',jsonb_build_object('id',a.id,'legal_name',a.legal_name,'city',a.city,'country_code',a.country_code,
   'vat_number',a.vat_number,'contact_email',a.contact_email,'plan',a.plan,'status',a.status,'is_demo',a.is_demo),
  'memorials',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'name',m.deceased_name,'status',m.status,'tier',m.tier,'is_demo',m.is_demo)
    order by m.created_at desc) from public.memorials m where m.agency_id=a.id),'[]'::jsonb),
  'members',coalesce((select jsonb_agg(jsonb_build_object('user_id',am.user_id,'role',am.role,'active',am.active))
    from public.agency_members am where am.agency_id=a.id),'[]'::jsonb))
 into result from public.agencies a where a.id=ctx.agency_id;
 else
 select jsonb_build_object(
  'context_id',ctx.id,'kind','FAMILY','expires_at',ctx.expires_at,
  'memorial',jsonb_build_object('id',m.id,'agency_id',m.agency_id,'name',m.deceased_name,
     'tier',m.tier,'status',m.status,'visibility',m.visibility,'is_demo',m.is_demo,'birth_date',m.birth_date,'death_date',m.death_date),
  'agency',jsonb_build_object('id',a.id,'legal_name',a.legal_name),
  'presentation',jsonb_build_object('name',m.deceased_name,'dedication',coalesce(p.dedication,''),'biography',coalesce(p.biography,''),
     'portrait_url',p.portrait_url,'portrait_focus_x',p.portrait_focus_x,'background',coalesce(v.published_preset,'montagna')),
  'backgrounds',coalesce((select jsonb_agg(jsonb_build_object('id',b.id,'label',b.label,'image_url',b.image_url) order by b.sort_order)
     from public.memorial_background_presets b where b.active),'[]'::jsonb),
  'members',coalesce((select jsonb_agg(jsonb_build_object('user_id',fm.user_id,'role',fm.role,'active',fm.active,
     'can_moderate',fm.can_moderate,'can_edit_content',fm.can_edit_content))
     from public.family_members fm where fm.memorial_id=m.id),'[]'::jsonb),
  'thoughts',coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'author',t.author_name,'body',t.body,'status',t.moderation_status)
     order by t.created_at desc) from public.memorial_thoughts t where t.memorial_id=m.id),'[]'::jsonb),
  'memories',coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'title',r.title,'body',r.body,'status',r.moderation_status)
     order by r.created_at desc) from public.memorial_memories r where r.memorial_id=m.id),'[]'::jsonb))
 into result from public.memorials m
 join public.agencies a on a.id=m.agency_id
 left join public.memorial_public_demo_profiles p on p.memorial_id=m.id
 left join public.memorial_visual_settings v on v.memorial_id=m.id
 where m.id=ctx.memorial_id;
 end if;
 if result is null then raise exception 'TARGET_NOT_FOUND' using errcode='22023';end if;
 return result;
end $$;

create or replace function public.platform_context_update_agency(context_key uuid,changes jsonb,reason text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); ctx public.platform_operator_contexts%rowtype;
 old_row jsonb;new_row jsonb; nm text; ci text; em text;
begin
 if actor is null or not exists(select 1 from public.platform_memberships p where p.user_id=actor and p.role='OWNER' and p.active)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 select * into ctx from public.platform_operator_contexts c
 where c.id=context_key and c.actor_id=actor and c.context_type='AGENCY' and c.closed_at is null and c.expires_at>now() for update;
 if not found then raise exception 'CONTEXT_EXPIRED_OR_DENIED' using errcode='42501';end if;
 if changes is null or jsonb_typeof(changes)<>'object'
   or exists(select 1 from jsonb_object_keys(changes) k where k not in ('legal_name','city','contact_email'))
   or length(btrim(coalesce(reason,'')))<8 or length(reason)>500
 then raise exception 'INVALID_CHANGE' using errcode='22023';end if;
 select jsonb_build_object('legal_name',legal_name,'city',city,'contact_email',contact_email)
 into old_row from public.agencies where id=ctx.agency_id for update;
 nm:=coalesce(changes->>'legal_name',old_row->>'legal_name');
 ci:=coalesce(changes->>'city',old_row->>'city');
 em:=coalesce(changes->>'contact_email',old_row->>'contact_email');
 if length(btrim(nm))<2 or length(nm)>240 or length(coalesce(ci,''))>150 or length(coalesce(em,''))>254
 or (coalesce(em,'')<>'' and em !~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$')
 then raise exception 'INVALID_AGENCY_PROFILE' using errcode='22023';end if;
 update public.agencies set legal_name=nm,city=nullif(ci,''),contact_email=nullif(em,'') where id=ctx.agency_id;
 select jsonb_build_object('legal_name',legal_name,'city',city,'contact_email',contact_email)
 into new_row from public.agencies where id=ctx.agency_id;
 if old_row is distinct from new_row then
 insert into public.platform_operator_context_events(context_id,actor_id,event_type,target_type,target_id,reason,before_data,after_data)
 values(ctx.id,actor,'AGENCY_PROFILE_UPDATED','AGENCY',ctx.agency_id,reason,old_row,new_row);
 end if;
 return new_row;
end $$;

create or replace function public.platform_context_update_family(context_key uuid,changes jsonb,reason text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid();ctx public.platform_operator_contexts%rowtype;result jsonb;before_row jsonb;
begin
 if actor is null or not exists(select 1 from public.platform_memberships p where p.user_id=actor and p.role='OWNER' and p.active)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 select * into ctx from public.platform_operator_contexts c
 where c.id=context_key and c.actor_id=actor and c.context_type='FAMILY' and c.closed_at is null and c.expires_at>now() for update;
 if not found then raise exception 'CONTEXT_EXPIRED_OR_DENIED' using errcode='42501';end if;
 select jsonb_build_object('name',m.deceased_name,'dedication',p.dedication,'biography',p.biography,
   'portrait_url',p.portrait_url,'portrait_focus_x',p.portrait_focus_x)
 into before_row from public.memorials m left join public.memorial_public_demo_profiles p on p.memorial_id=m.id where m.id=ctx.memorial_id;
 result:=public.platform_update_memorial_presentation(ctx.memorial_id,changes,reason);
 if before_row is distinct from result then
 insert into public.platform_operator_context_events(context_id,actor_id,event_type,target_type,target_id,reason,before_data,after_data)
 values(ctx.id,actor,'FAMILY_PRESENTATION_UPDATED','MEMORIAL',ctx.memorial_id,reason,before_row,result);
 end if;
 return result;
end $$;

create or replace function public.platform_context_moderate(context_key uuid,resource text,record_id uuid,operation text,fields jsonb,reason text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid();ctx public.platform_operator_contexts%rowtype; result jsonb;
begin
 if actor is null or not exists(select 1 from public.platform_memberships p where p.user_id=actor and p.role='OWNER' and p.active)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 select * into ctx from public.platform_operator_contexts c
 where c.id=context_key and c.actor_id=actor and c.context_type='FAMILY' and c.closed_at is null and c.expires_at>now() for update;
 if not found then raise exception 'CONTEXT_EXPIRED_OR_DENIED' using errcode='42501';end if;
 result:=public.platform_manage_memorial_contribution(ctx.memorial_id,resource,record_id,operation,coalesce(fields,'{}'::jsonb),reason);
 insert into public.platform_operator_context_events(context_id,actor_id,event_type,target_type,target_id,reason,after_data)
 values(ctx.id,actor,'FAMILY_'||resource||'_'||operation,'MEMORIAL',ctx.memorial_id,reason,
  jsonb_build_object('record_id',result->>'id','result',result->>'status'));
 return result;
end $$;

create or replace function public.platform_context_set_background(context_key uuid,preset text,reason text)
returns text language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid();ctx public.platform_operator_contexts%rowtype;prior text;changed text;
begin
 if actor is null or not exists(select 1 from public.platform_memberships p where p.user_id=actor and p.role='OWNER' and p.active)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 select * into ctx from public.platform_operator_contexts c
 where c.id=context_key and c.actor_id=actor and c.context_type='FAMILY' and c.closed_at is null and c.expires_at>now() for update;
 if not found then raise exception 'CONTEXT_EXPIRED_OR_DENIED' using errcode='42501';end if;
 select coalesce(v.published_preset,'montagna') into prior from public.memorials m
 left join public.memorial_visual_settings v on v.memorial_id=m.id where m.id=ctx.memorial_id;
 changed:=public.platform_override_memorial_background(ctx.memorial_id,preset,reason);
 if prior is distinct from changed then
 insert into public.platform_operator_context_events(context_id,actor_id,event_type,target_type,target_id,reason,before_data,after_data)
 values(ctx.id,actor,'FAMILY_BACKGROUND_UPDATED','MEMORIAL',ctx.memorial_id,reason,
 jsonb_build_object('preset',prior),jsonb_build_object('preset',changed));
 end if;
 return changed;
end $$;

create or replace function public.platform_close_operator_context(context_key uuid)
returns boolean language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid();ctx public.platform_operator_contexts%rowtype;
begin
 if actor is null or not exists(select 1 from public.platform_memberships p where p.user_id=actor and p.role='OWNER' and p.active)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 select * into ctx from public.platform_operator_contexts c
 where c.id=context_key and c.actor_id=actor and c.closed_at is null for update;
 if not found then return false;end if;
 update public.platform_operator_contexts set closed_at=now() where id=ctx.id;
 insert into public.platform_operator_context_events(context_id,actor_id,event_type,target_type,target_id)
 values(ctx.id,actor,'VIEW_CLOSED',ctx.context_type,coalesce(ctx.agency_id,ctx.memorial_id));
 return true;
end $$;

create or replace function public.platform_get_operator_context_events(context_key uuid)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare actor uuid:=auth.uid();result jsonb;
begin
 if actor is null or not exists(select 1 from public.platform_memberships p where p.user_id=actor and p.role='OWNER' and p.active)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 if not exists(select 1 from public.platform_operator_contexts c where c.id=context_key and c.actor_id=actor)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 select coalesce(jsonb_agg(jsonb_build_object('action',e.event_type,'at',e.occurred_at,'reason',e.reason,
 'before',e.before_data,'after',e.after_data) order by e.occurred_at desc),'[]'::jsonb)
 into result from public.platform_operator_context_events e where e.context_id=context_key;
 return result;
end $$;

do $$
declare sig text;
begin
 foreach sig in array array[
  'platform_start_operator_context(text,uuid)',
  'platform_get_operator_context(uuid)',
  'platform_context_update_agency(uuid,jsonb,text)',
  'platform_context_update_family(uuid,jsonb,text)',
  'platform_context_moderate(uuid,text,uuid,text,jsonb,text)',
  'platform_context_set_background(uuid,text,text)',
  'platform_close_operator_context(uuid)',
  'platform_get_operator_context_events(uuid)'
 ] loop
  execute 'revoke all on function public.'||sig||' from public,anon,authenticated';
  execute 'grant execute on function public.'||sig||' to authenticated';
 end loop;
end $$;
