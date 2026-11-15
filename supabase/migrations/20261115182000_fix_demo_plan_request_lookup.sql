create or replace function public.agency_demo_choose_plan(agency_key uuid,selected_plan text,request_key uuid,context_key uuid default null)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); demo boolean; agency_status text; previous text; fee int; event_key uuid;
begin
 if actor is null or selected_plan not in ('PAYG','MONTHLY','YEARLY') or request_key is null
 then raise exception 'INVALID_REQUEST' using errcode='22023';end if;
 if not (
  exists(select 1 from public.agency_members am where am.agency_id=agency_key and am.user_id=actor and am.active and context_key is null)
  or exists(select 1 from public.platform_operator_contexts ctx join public.platform_memberships pm on pm.user_id=ctx.actor_id
    where ctx.id=context_key and ctx.agency_id=agency_key and ctx.context_type='AGENCY'
    and ctx.closed_at is null and ctx.expires_at>now() and pm.user_id=actor and pm.role='OWNER' and pm.active)
 ) then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 select a.is_demo,a.status into demo,agency_status from public.agencies a where a.id=agency_key for update;
 if demo is distinct from true or agency_status<>'ACTIVE' then raise exception 'DEMO_AGENCY_NOT_ACTIVE' using errcode='42501';end if;
 select plan_code into previous from public.demo_agency_commercial_state where agency_id=agency_key for update;
 if previous is null then raise exception 'DEMO_STATE_MISSING' using errcode='22023';end if;
 if exists(select 1 from public.demo_agency_commercial_events where agency_id=agency_key and demo_agency_commercial_events.request_key=agency_demo_choose_plan.request_key)
 then return public.agency_demo_commercial_snapshot(agency_key,context_key);end if;
 if selected_plan is distinct from previous then
  fee:=case selected_plan when 'MONTHLY' then 3990 when 'YEARLY' then 37900 else 0 end;
  update public.demo_agency_commercial_state set plan_code=selected_plan,changed_at=now() where agency_id=agency_key;
  insert into public.demo_agency_commercial_events(agency_id,actor_id,action,plan_code,amount_cents,request_key)
  values(agency_key,actor,'PLAN_SELECTED',selected_plan,fee,request_key) returning id into event_key;
 end if;
 return public.agency_demo_commercial_snapshot(agency_key,context_key);
end $$;