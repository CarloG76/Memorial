-- Live action notifications: calculated from current pending work, not fake unread events.
-- Scoped independently to SuperAdmin, agency membership and family moderation.
create or replace function public.workspace_notifications_snapshot(area_key text)
returns jsonb
language plpgsql stable security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); result jsonb;
begin
 if actor is null or area_key not in ('piattaforma','agenzia','famiglia')
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 if area_key='piattaforma' and not exists(
  select 1 from public.platform_memberships p where p.user_id=actor and p.role='OWNER' and p.active)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 if area_key='agenzia' and not exists(
  select 1 from public.agency_members am where am.user_id=actor and am.active)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 if area_key='famiglia' and not exists(
  select 1 from public.family_members fm where fm.user_id=actor and fm.active)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 with work as (
  select 'VISITOR_MEMORY_PENDING'::text as kind,
         m.agency_id,m.id as memorial_id,m.deceased_name as title,a.legal_name as agency_name,
         count(r.id)::int as quantity,max(r.created_at) as last_at
  from public.memorials m
  join public.agencies a on a.id=m.agency_id
  join public.memorial_memories r on r.memorial_id=m.id and r.visitor_submitted=true and r.moderation_status='PENDING'
  where (area_key='piattaforma'
    or (area_key='agenzia' and exists(select 1 from public.agency_members am where am.agency_id=m.agency_id and am.user_id=actor and am.active))
    or (area_key='famiglia' and exists(select 1 from public.family_members fm where fm.memorial_id=m.id and fm.user_id=actor and fm.active and (fm.role='OWNER' or fm.can_moderate))))
  group by m.agency_id,m.id,m.deceased_name,a.legal_name
  union all
  select 'PAYMENT_PENDING'::text,m.agency_id,m.id,m.deceased_name,a.legal_name,1::int,m.created_at
  from public.memorials m join public.agencies a on a.id=m.agency_id
  where m.status='PAYMENT_PENDING' and (area_key='piattaforma'
   or (area_key='agenzia' and exists(select 1 from public.agency_members am where am.agency_id=m.agency_id and am.user_id=actor and am.active)))
  union all
  select 'AGENCY_INACTIVE'::text,a.id,null::uuid,a.legal_name,a.legal_name,1::int,a.created_at
  from public.agencies a where a.status<>'ACTIVE' and area_key='piattaforma'
 )
 select jsonb_build_object('items',coalesce(jsonb_agg(
 jsonb_build_object('kind',kind,'agency_id',agency_id,'memorial_id',memorial_id,'title',title,'agency_name',agency_name,'count',quantity,'last_at',last_at)
 order by last_at desc nulls last), '[]'::jsonb)) into result
 from (select * from work order by last_at desc nulls last limit 150) subset;
 return result;
end $$;
revoke all on function public.workspace_notifications_snapshot(text) from public,anon,authenticated;
grant execute on function public.workspace_notifications_snapshot(text) to authenticated;
