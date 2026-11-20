-- Family-authored memories are approved immediately. Visitor proposals stay PENDING.
create or replace function public.family_create_direct_memory(
 target_memorial uuid, memory_title text, memory_body text, context_key uuid default null
) returns jsonb language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); demo boolean; new_id uuid; payload jsonb;
begin
 if actor is null then raise exception 'NOT_AUTHORIZED' using errcode='42501'; end if;
 if length(btrim(coalesce(memory_title,'')))<2 or length(memory_title)>180
 or length(btrim(coalesce(memory_body,'')))<10 or length(memory_body)>10000
 then raise exception 'INVALID_MEMORY' using errcode='22023'; end if;
 select m.is_demo into demo from public.memorials m where m.id=target_memorial;
 if demo is null then raise exception 'MEMORIAL_NOT_FOUND' using errcode='22023'; end if;
 if context_key is null then
  if not exists(select 1 from public.family_members fm
    where fm.memorial_id=target_memorial and fm.user_id=actor and fm.active
    and (fm.role='OWNER' or (fm.role='EDITOR' and fm.can_edit_content)))
  then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 else
  if not exists(select 1 from public.platform_operator_contexts ctx
   join public.platform_memberships pm on pm.user_id=ctx.actor_id
   where ctx.id=context_key and ctx.actor_id=actor and pm.role='OWNER' and pm.active
   and ctx.context_type='FAMILY' and ctx.memorial_id=target_memorial
   and ctx.closed_at is null and ctx.expires_at>now())
  then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 end if;
 insert into public.memorial_memories(memorial_id,is_demo,title,body,moderation_status,visitor_submitted)
 values(target_memorial,demo,btrim(memory_title),btrim(memory_body),'APPROVED',false)
 returning id into new_id;
 payload:=jsonb_build_object('id',new_id,'status','APPROVED');
 insert into public.memorial_presentation_audit(memorial_id,actor_id,action,old_values,new_values)
 values(target_memorial,actor,'FAMILY_MEMORY_CREATED','{}'::jsonb,
 jsonb_build_object('id',new_id,'title',btrim(memory_title),'status','APPROVED','visitor_submitted',false));
 if context_key is not null then
  insert into public.platform_operator_context_events(context_id,actor_id,event_type,target_type,target_id,after_data)
  values(context_key,actor,'FAMILY_MEMORY_DIRECT_CREATE','MEMORIAL',target_memorial,payload);
 end if;
 return payload;
end $$;
revoke all on function public.family_create_direct_memory(uuid,text,text,uuid) from public,anon,authenticated;
grant execute on function public.family_create_direct_memory(uuid,text,text,uuid) to authenticated;
