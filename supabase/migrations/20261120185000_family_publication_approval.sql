-- Family-controlled initial publication. A simulated demo payment is never
-- evidence of a real transaction; only explicitly demo memorials may use it.
create table if not exists public.memorial_publication_approvals(
 memorial_id uuid primary key references public.memorials(id) on delete cascade,
 actor_id uuid not null references auth.users(id),
 content_sha256 text not null,
 visibility text not null check(visibility in ('UNLISTED','PUBLIC')),
 approved_at timestamptz not null default now(),
 approved_version jsonb not null
);
alter table public.memorial_publication_approvals enable row level security;
revoke all on public.memorial_publication_approvals from anon,authenticated;

create or replace function public.family_publication_check(target_memorial uuid)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); m public.memorials%rowtype;
p public.memorial_public_demo_profiles%rowtype;
paid boolean; eligible boolean; issues text[]:=array[]::text[];
begin
 select * into m from public.memorials where id=target_memorial;
 if not found then raise exception 'MEMORIAL_NOT_FOUND' using errcode='22023';end if;
 if actor is null or not exists(select 1 from public.family_members fm where fm.memorial_id=m.id and fm.user_id=actor and fm.role='OWNER' and fm.active)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
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
 'already_published',m.status='PUBLISHED_ACTIVE');
end $$;

create or replace function public.family_publish_memorial(target_memorial uuid, selected_visibility text,
 approval boolean, expected_content_hash text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); m public.memorials%rowtype; p public.memorial_public_demo_profiles%rowtype;
snapshot jsonb; digest_hex text; token text; check_result jsonb;
begin
 if actor is null or approval is distinct from true or selected_visibility not in ('UNLISTED','PUBLIC')
 then raise exception 'EXPLICIT_APPROVAL_REQUIRED' using errcode='22023';end if;
 -- Lock the memorial before rechecking the approval and content version.
 select * into m from public.memorials where id=target_memorial for update;
 if not found then raise exception 'MEMORIAL_NOT_FOUND' using errcode='22023';end if;
 if not exists(select 1 from public.family_members fm where fm.memorial_id=m.id and fm.user_id=actor and fm.role='OWNER' and fm.active)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 if m.status='PUBLISHED_ACTIVE' then
  return jsonb_build_object('status',m.status,'public_token',m.public_token,'already_published',true);
 end if;
 check_result:=public.family_publication_check(target_memorial);
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
 insert into public.memorial_publication_approvals(memorial_id,actor_id,content_sha256,visibility,approved_version)
 values(m.id,actor,digest_hex,selected_visibility,snapshot);
 insert into public.memorial_presentation_audit(memorial_id,actor_id,action,old_values,new_values)
 values(m.id,actor,'FAMILY_APPROVES_PUBLICATION',
 jsonb_build_object('status',m.status,'visibility',m.visibility),
 jsonb_build_object('status','PUBLISHED_ACTIVE','visibility',selected_visibility,'sha256',digest_hex));
 return jsonb_build_object('status','PUBLISHED_ACTIVE','public_token',token,'already_published',false);
end $$;

create or replace function public.family_publication_version(target_memorial uuid)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare actor uuid:=auth.uid();m public.memorials%rowtype;p public.memorial_public_demo_profiles%rowtype;snapshot jsonb;
begin
 select * into m from public.memorials where id=target_memorial;
 if not found or actor is null or not exists(select 1 from public.family_members f where f.memorial_id=m.id and f.user_id=actor and f.role='OWNER' and f.active)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 select * into p from public.memorial_public_demo_profiles where memorial_id=m.id;
 snapshot:=jsonb_build_object('name',m.deceased_name,'tier',m.tier,'birth_date',m.birth_date,'death_date',m.death_date,
 'dedication',p.dedication,'biography',p.biography,'story',p.story,'highlights',p.highlights,'portrait_url',p.portrait_url,'portrait_focus_x',p.portrait_focus_x);
 return jsonb_build_object('hash',encode(extensions.digest(snapshot::text,'sha256'),'hex'),'snapshot',snapshot);
end $$;

revoke all on function public.family_publication_check(uuid),public.family_publication_version(uuid),public.family_publish_memorial(uuid,text,boolean,text) from public,anon,authenticated;
grant execute on function public.family_publication_check(uuid),public.family_publication_version(uuid),public.family_publish_memorial(uuid,text,boolean,text) to authenticated;
