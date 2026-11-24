CREATE OR REPLACE FUNCTION public.agency_get_family_context(context_key uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare actor uuid:=auth.uid();payload jsonb;
begin
 select jsonb_build_object('context_id',c.id,'memorial_id',m.id,'name',m.deceased_name,'status',m.status,'tier',m.tier,
 'agency_name',a.legal_name,'expires_at',c.expires_at)
 into payload from public.agency_family_operator_contexts c
 join public.memorials m on m.id=c.memorial_id and m.agency_id=c.agency_id
 join public.agencies a on a.id=c.agency_id
 join public.agency_members am on am.agency_id=c.agency_id and am.user_id=c.actor_id and am.active and am.role in ('OWNER','OPERATOR')
 where c.id=context_key and c.actor_id=actor and c.closed_at is null and c.expires_at>now();
 if payload is null then raise exception 'CONTEXT_EXPIRED_OR_DENIED' using errcode='42501';end if;
 return payload;
end $function$;