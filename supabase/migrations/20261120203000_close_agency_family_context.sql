create or replace function public.agency_close_family_context(context_key uuid)
returns boolean language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid();target uuid;
begin
 update public.agency_family_operator_contexts c set closed_at=now()
 where c.id=context_key and c.actor_id=actor and c.closed_at is null
 returning c.memorial_id into target;
 if target is null then raise exception 'CONTEXT_EXPIRED_OR_DENIED' using errcode='42501';end if;
 insert into public.agency_family_operator_events(context_id,actor_id,action,memorial_id)
 values(context_key,actor,'EXIT_AS_FAMILY',target);
 return true;
end $$;
revoke all on function public.agency_close_family_context(uuid) from public,anon,authenticated;
grant execute on function public.agency_close_family_context(uuid) to authenticated;
