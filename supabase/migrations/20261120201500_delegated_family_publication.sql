-- Explicit agency and platform delegation for family publication. The real
-- actor is always auth.uid(), never an impersonated family user.
create table if not exists public.agency_family_operator_contexts(
 id uuid primary key default gen_random_uuid(),
 actor_id uuid not null references auth.users(id),
 agency_id uuid not null references public.agencies(id),
 memorial_id uuid not null references public.memorials(id),
 started_at timestamptz not null default now(),
 expires_at timestamptz not null default (now()+interval '2 hours'),
 closed_at timestamptz
);
alter table public.agency_family_operator_contexts enable row level security;
revoke all on public.agency_family_operator_contexts from anon,authenticated;
create table if not exists public.agency_family_operator_events(
 id bigint generated always as identity primary key,
 context_id uuid not null references public.agency_family_operator_contexts(id),
 actor_id uuid not null references auth.users(id),
 action text not null,
 memorial_id uuid not null references public.memorials(id),
 data jsonb not null default '{}'::jsonb,
 at timestamptz not null default now()
);
alter table public.agency_family_operator_events enable row level security;
revoke all on public.agency_family_operator_events from anon,authenticated;

create or replace function public.agency_start_family_context(target_memorial uuid)
returns uuid language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid();agency_key uuid; cid uuid;
begin
 if actor is null then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 select agency_id into agency_key from public.memorials where id=target_memorial;
 if agency_key is null or not exists(select 1 from public.agency_members am
 where am.agency_id=agency_key and am.user_id=actor and am.active and am.role in ('OWNER','OPERATOR'))
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 insert into public.agency_family_operator_contexts(actor_id,agency_id,memorial_id)
 values(actor,agency_key,target_memorial) returning id into cid;
 insert into public.agency_family_operator_events(context_id,actor_id,action,memorial_id)
 values(cid,actor,'ENTER_AS_FAMILY',target_memorial);
 return cid;
end $$;

create or replace function public.agency_get_family_context(context_key uuid)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare actor uuid:=auth.uid();payload jsonb;
begin
 select jsonb_build_object('context_id',c.id,'memorial_id',m.id,'name',m.deceased_name,'status',m.status,
 'agency_name',a.legal_name,'expires_at',c.expires_at)
 into payload from public.agency_family_operator_contexts c
 join public.memorials m on m.id=c.memorial_id and m.agency_id=c.agency_id
 join public.agencies a on a.id=c.agency_id
 join public.agency_members am on am.agency_id=c.agency_id and am.user_id=c.actor_id and am.active and am.role in ('OWNER','OPERATOR')
 where c.id=context_key and c.actor_id=actor and c.closed_at is null and c.expires_at>now();
 if payload is null then raise exception 'CONTEXT_EXPIRED_OR_DENIED' using errcode='42501';end if;
 return payload;
end $$;

create or replace function public.memorial_publication_actor_type(target_memorial uuid,context_key uuid)
returns text language plpgsql stable security definer set search_path=''
as $$
declare actor uuid:=auth.uid();
begin
 if actor is null then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 if context_key is null then
  if exists(select 1 from public.family_members f where f.memorial_id=target_memorial and f.user_id=actor and f.active and f.role='OWNER')
  then return 'FAMILY_OWNER';end if;
 else
  if exists(select 1 from public.platform_operator_contexts c join public.platform_memberships p on p.user_id=c.actor_id
   where c.id=context_key and c.actor_id=actor and c.context_type='FAMILY'
   and c.memorial_id=target_memorial and c.closed_at is null and c.expires_at>now() and p.role='OWNER' and p.active)
  then return 'SUPERADMIN_AS_FAMILY';end if;
  if exists(select 1 from public.agency_family_operator_contexts c
   join public.agency_members am on am.agency_id=c.agency_id and am.user_id=c.actor_id and am.active and am.role in ('OWNER','OPERATOR')
   join public.memorials m on m.id=c.memorial_id and m.agency_id=c.agency_id
   where c.id=context_key and c.actor_id=actor and c.memorial_id=target_memorial and c.closed_at is null and c.expires_at>now())
  then return 'AGENCY_AS_FAMILY';end if;
 end if;
 raise exception 'NOT_AUTHORIZED' using errcode='42501';
end $$;

alter table public.memorial_publication_approvals
add column if not exists acting_as text not null default 'FAMILY_OWNER',
add column if not exists delegated_context_id uuid;

CREATE OR REPLACE FUNCTION public.family_publication_check_context(target_memorial uuid, context_key uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare actor uuid:=auth.uid(); m public.memorials%rowtype;
p public.memorial_public_demo_profiles%rowtype;
paid boolean; eligible boolean; issues text[]:=array[]::text[];
begin
 select * into m from public.memorials where id=target_memorial;
 if not found then raise exception 'MEMORIAL_NOT_FOUND' using errcode='22023';end if;
 perform public.memorial_publication_actor_type(target_memorial,context_key);
 select * into p from public.memorial_public_demo_profiles where memorial_id=m.id;
 eligible:=coalesce(
  (m.is_demo and exists(select 1 from public.demo_agency_commercial_events x where x.memorial_id=m.id
    and x.action='MEMORIAL_CONFIRMED' and x.simulated))
  or (not m.is_demo and exists(select 1 from public.agency_free_memorial_activations x where x.memorial_id=m.id))
 ,false);
 if not eligible then issues:=array_append(issues,'Pagamento o attivazione gratuita non verificati');end if;
 if m.status not in ('SKELETON_ACTIVE','FAMILY_PREPARING','READY_FOR_PUBLICATION','PUBLISHED_ACTIVE') then
  issues:=array_append(issues,'Stato non idoneo alla pubblicazione');end if;
 if length(btrim(coalesce(m.deceased_name,'')))<3 then issues:=array_append(issues,'Nome della persona mancante');end if;
 if length(btrim(coalesce(p.biography,'')))<30 then issues:=array_append(issues,'Biografia troppo breve (minimo 30 caratteri)');end if;
 if coalesce(p.portrait_url,'')='' then issues:=array_append(issues,'Fotografia del defunto mancante');end if;
 return jsonb_build_object('ready',cardinality(issues)=0,'issues',to_jsonb(issues),
 'memorial_id',m.id,'name',m.deceased_name,'status',m.status,'visibility',m.visibility,
 'already_published',m.status='PUBLISHED_ACTIVE','share_token',case when m.status='PUBLISHED_ACTIVE' then m.public_token else null end);
end $function$;

CREATE OR REPLACE FUNCTION public.family_publication_version_context(target_memorial uuid, context_key uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare actor uuid:=auth.uid();m public.memorials%rowtype;p public.memorial_public_demo_profiles%rowtype;snapshot jsonb;
begin
 select * into m from public.memorials where id=target_memorial;
 if not found then raise exception 'MEMORIAL_NOT_FOUND' using errcode='22023';end if;
 perform public.memorial_publication_actor_type(target_memorial,context_key);
 select * into p from public.memorial_public_demo_profiles where memorial_id=m.id;
 snapshot:=jsonb_build_object('name',m.deceased_name,'tier',m.tier,'birth_date',m.birth_date,'death_date',m.death_date,
 'dedication',p.dedication,'biography',p.biography,'story',p.story,'highlights',p.highlights,'portrait_url',p.portrait_url,'portrait_focus_x',p.portrait_focus_x);
 return jsonb_build_object('hash',encode(extensions.digest(snapshot::text,'sha256'),'hex'),'snapshot',snapshot);
end $function$;

CREATE OR REPLACE FUNCTION public.family_publish_memorial_context(target_memorial uuid, selected_visibility text, approval boolean, expected_content_hash text, context_key uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare actor uuid:=auth.uid(); m public.memorials%rowtype; p public.memorial_public_demo_profiles%rowtype;
snapshot jsonb; digest_hex text; token text; check_result jsonb; actor_type text;
begin
 if actor is null or approval is distinct from true or selected_visibility not in ('UNLISTED','PUBLIC')
 then raise exception 'EXPLICIT_APPROVAL_REQUIRED' using errcode='22023';end if;
 -- Lock the memorial before rechecking the approval and content version.
 select * into m from public.memorials where id=target_memorial for update;
 if not found then raise exception 'MEMORIAL_NOT_FOUND' using errcode='22023';end if;
 actor_type:=public.memorial_publication_actor_type(target_memorial,context_key);
 if m.status='PUBLISHED_ACTIVE' then
  return jsonb_build_object('status',m.status,'public_token',m.public_token,'already_published',true);
 end if;
 check_result:=public.family_publication_check_context(target_memorial,context_key);
 if not (check_result->>'ready')::boolean then raise exception 'PUBLICATION_REQUIREMENTS_NOT_MET: %',check_result->>'issues' using errcode='22023';end if;
 select * into p from public.memorial_public_demo_profiles where memorial_id=m.id;
 snapshot:=jsonb_build_object('name',m.deceased_name,'tier',m.tier,'birth_date',m.birth_date,'death_date',m.death_date,
 'dedication',p.dedication,'biography',p.biography,'story',p.story,'highlights',p.highlights,'portrait_url',p.portrait_url,'portrait_focus_x',p.portrait_focus_x);
 digest_hex:=encode(extensions.digest(snapshot::text,'sha256'),'hex');
 if expected_content_hash is distinct from digest_hex then raise exception 'CONTENT_VERSION_CHANGED' using errcode='22023';end if;
 token:=coalesce(nullif(m.public_token,''),encode(extensions.gen_random_bytes(24),'hex'));
 update public.memorials set status='PUBLISHED_ACTIVE', visibility=selected_visibility,
 public_token=token,first_published_at=coalesce(first_published_at,now()),
 covered_until=coalesce(covered_until,now()+interval '1 year') where id=m.id;
 insert into public.memorial_publication_approvals(memorial_id,actor_id,content_sha256,visibility,approved_version,acting_as,delegated_context_id)
 values(m.id,actor,digest_hex,selected_visibility,snapshot,actor_type,context_key);
 insert into public.memorial_presentation_audit(memorial_id,actor_id,action,old_values,new_values)
 values(m.id,actor,'FAMILY_APPROVES_PUBLICATION',
 jsonb_build_object('status',m.status,'visibility',m.visibility),
 jsonb_build_object('status','PUBLISHED_ACTIVE','visibility',selected_visibility,'sha256',digest_hex,'actor_type',actor_type,'actual_actor_id',actor,'delegated_context_id',context_key));
 if actor_type='SUPERADMIN_AS_FAMILY' then
  insert into public.platform_operator_context_events(context_id,actor_id,event_type,target_type,target_id,after_data)
  values(context_key,actor,'FAMILY_PUBLICATION_DELEGATED','MEMORIAL',m.id,jsonb_build_object('visibility',selected_visibility));
 elsif actor_type='AGENCY_AS_FAMILY' then
  insert into public.agency_family_operator_events(context_id,actor_id,action,memorial_id,data)
  values(context_key,actor,'FAMILY_PUBLICATION_DELEGATED',m.id,jsonb_build_object('visibility',selected_visibility));
 end if;
 return jsonb_build_object('status','PUBLISHED_ACTIVE','public_token',token,'already_published',false);
end $function$;


create or replace function public.family_publication_check(target_memorial uuid)
returns jsonb language sql stable security definer set search_path=''
as $$select public.family_publication_check_context(target_memorial,null::uuid)$$;
create or replace function public.family_publication_version(target_memorial uuid)
returns jsonb language sql stable security definer set search_path=''
as $$select public.family_publication_version_context(target_memorial,null::uuid)$$;
create or replace function public.family_publish_memorial(target_memorial uuid,selected_visibility text,approval boolean,expected_content_hash text)
returns jsonb language sql security definer set search_path=''
as $$select public.family_publish_memorial_context(target_memorial,selected_visibility,approval,expected_content_hash,null::uuid)$$;

revoke all on function
 public.agency_start_family_context(uuid),
 public.agency_get_family_context(uuid),
 public.memorial_publication_actor_type(uuid,uuid),
 public.family_publication_check_context(uuid,uuid),
 public.family_publication_version_context(uuid,uuid),
 public.family_publish_memorial_context(uuid,text,boolean,text,uuid)
from public,anon,authenticated;
grant execute on function
 public.agency_start_family_context(uuid),
 public.agency_get_family_context(uuid),
 public.family_publication_check_context(uuid,uuid),
 public.family_publication_version_context(uuid,uuid),
 public.family_publish_memorial_context(uuid,text,boolean,text,uuid)
to authenticated;
