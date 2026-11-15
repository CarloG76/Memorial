-- Reset removes ONLY memorials created by the agency commercial sandbox, then delegates
-- to the audited baseline restore. Never modify real agency/customer memorials.
alter function public.platform_reset_demo_data(text) rename to platform_reset_demo_data_baseline;
revoke all on function public.platform_reset_demo_data_baseline(text) from public,anon,authenticated;

create or replace function public.platform_reset_demo_data(confirmation text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); extras uuid[]; restored jsonb;
begin
 if actor is null or not exists(select 1 from public.platform_memberships pm where pm.user_id=actor and pm.role='OWNER' and pm.active)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 if confirmation is distinct from 'RESET DEMO DATA' then raise exception 'CONFIRMATION_REQUIRED' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtext('memorial_demo_reset_v1'));
 perform pg_advisory_xact_lock(hashtext('memorial_demo_checkout_codes'));
 select array_agg(distinct m.id) into extras
 from public.demo_agency_commercial_events e
 join public.memorials m on m.id=e.memorial_id and m.is_demo=true
 where e.action='MEMORIAL_CONFIRMED'
 and not exists (
   select 1 from app_private.demo_reset_baseline b cross join lateral jsonb_array_elements(b.rows) x
   where b.table_name='memorials' and (x->>'id')::uuid=m.id
 );
 if extras is not null then
  -- A non-demo reference must abort the transaction rather than be silently removed.
  if exists(select 1 from public.family_members fm where fm.memorial_id=any(extras) and not fm.is_demo)
   or exists(select 1 from public.memorial_memories mm where mm.memorial_id=any(extras) and not mm.is_demo)
   or exists(select 1 from public.memorial_thoughts mt where mt.memorial_id=any(extras) and not mt.is_demo)
  then raise exception 'NON_DEMO_ASSOCIATION_FOUND';end if;
  delete from public.platform_operator_context_events e
  where exists(select 1 from public.platform_operator_contexts c where c.id=e.context_id and c.memorial_id=any(extras));
  delete from public.platform_operator_contexts where memorial_id=any(extras);
  delete from public.memorial_presentation_audit where memorial_id=any(extras);
  delete from public.family_members where memorial_id=any(extras) and is_demo;
  delete from public.family_invites where memorial_id=any(extras) and is_demo;
  delete from public.memorial_memories where memorial_id=any(extras) and is_demo;
  delete from public.memorial_thoughts where memorial_id=any(extras) and is_demo;
  delete from public.memorial_demo_slots where memorial_id=any(extras);
  delete from public.memorial_family_entities where memorial_id=any(extras);
  delete from public.demo_agency_commercial_events where memorial_id=any(extras);
  delete from public.memorials where id=any(extras) and is_demo;
 end if;
 delete from public.demo_agency_commercial_events e
 where exists(select 1 from public.agencies a where a.id=e.agency_id and a.is_demo);
 update public.demo_agency_commercial_state s set plan_code='PAYG',free_used=0,changed_at=now()
 where exists(select 1 from public.agencies a where a.id=s.agency_id and a.is_demo);
 delete from public.family_entities fe
 where fe.is_demo and not exists(select 1 from public.memorial_family_entities l where l.family_id=fe.id);
 restored:=public.platform_reset_demo_data_baseline(confirmation);
 return restored||jsonb_build_object('sandbox_memorials_removed',coalesce(cardinality(extras),0),'sandbox_orders_reset',true);
end $$;
revoke all on function public.platform_reset_demo_data(text) from public,anon,authenticated;
grant execute on function public.platform_reset_demo_data(text) to authenticated;
