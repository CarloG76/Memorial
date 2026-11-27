-- MVP0: audited SuperAdmin portrait edits in an active FAMILY operator context.
-- The SuperAdmin may edit directly elsewhere as PLATFORM OWNER, but "Apri come
-- Famiglia" must record who acted, in which context, and what was changed.
create or replace function public.platform_context_set_memorial_portrait(
 memorial_key uuid, object_key text, context_key uuid
)
returns text language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); ctx public.platform_operator_contexts%rowtype;
 old_path text; new_path text;
begin
 if actor is null or not exists(
  select 1 from public.platform_memberships p
  where p.user_id=actor and p.role='OWNER' and p.active
 ) then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 select * into ctx from public.platform_operator_contexts c
 where c.id=context_key and c.actor_id=actor and c.context_type='FAMILY'
  and c.memorial_id=memorial_key and c.closed_at is null and c.expires_at>now()
 for update;
 if not found then raise exception 'CONTEXT_EXPIRED_OR_DENIED' using errcode='42501';end if;
 select portrait_url into old_path
 from public.memorial_public_demo_profiles where memorial_id=memorial_key;
 new_path:=public.set_memorial_portrait(memorial_key,object_key);
 insert into public.platform_operator_context_events(
  context_id,actor_id,event_type,target_type,target_id,before_data,after_data
 ) values(
  ctx.id,actor,'FAMILY_PORTRAIT_UPDATED','MEMORIAL',memorial_key,
  jsonb_build_object('portrait_url',old_path),
  jsonb_build_object('portrait_url',new_path)
 );
 return new_path;
end $$;
revoke all on function public.platform_context_set_memorial_portrait(uuid,text,uuid)
 from public,anon,authenticated;
grant execute on function public.platform_context_set_memorial_portrait(uuid,text,uuid)
 to authenticated;
