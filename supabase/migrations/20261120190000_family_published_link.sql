CREATE OR REPLACE FUNCTION public.family_publication_check(target_memorial uuid)
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
 'already_published',m.status='PUBLISHED_ACTIVE','share_token',case when m.status='PUBLISHED_ACTIVE' then m.public_token else null end);
end $function$
