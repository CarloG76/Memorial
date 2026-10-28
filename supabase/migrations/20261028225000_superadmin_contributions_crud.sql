
create or replace function public.platform_get_memorial_contributions(target_memorial uuid)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare result jsonb;
begin
 if not exists(select 1 from public.platform_memberships p where p.user_id=auth.uid() and p.role='OWNER' and p.active)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 select jsonb_build_object(
 'thoughts',coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'author',t.author_name,'body',t.body,'status',t.moderation_status) order by t.created_at desc) from public.memorial_thoughts t where t.memorial_id=target_memorial),'[]'::jsonb),
 'memories',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'title',m.title,'body',m.body,'status',m.moderation_status) order by m.created_at desc) from public.memorial_memories m where m.memorial_id=target_memorial),'[]'::jsonb))
 into result;
 return result;
end $$;
revoke all on function public.platform_get_memorial_contributions(uuid) from public,anon,authenticated;
grant execute on function public.platform_get_memorial_contributions(uuid) to authenticated;

create or replace function public.platform_manage_memorial_contribution(
 target_memorial uuid,resource text,record_id uuid,operation text,fields jsonb,reason text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); prior jsonb;after jsonb;new_id uuid;demo boolean; st text;
begin
 if actor is null or not exists(select 1 from public.platform_memberships p where p.user_id=actor and p.role='OWNER' and p.active)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 if resource not in ('THOUGHT','MEMORY') or operation not in ('CREATE','EDIT','APPROVE','REJECT','DELETE')
 or length(btrim(coalesce(reason,'')))<8 or length(reason)>500
 or fields is null or jsonb_typeof(fields)<>'object'
 then raise exception 'INVALID_OPERATION' using errcode='22023';end if;
 select is_demo into demo from public.memorials where id=target_memorial;
 if demo is null then raise exception 'MEMORIAL_NOT_FOUND' using errcode='22023';end if;
 if operation in ('CREATE','EDIT') then
  if resource='THOUGHT' and
    (exists(select 1 from jsonb_object_keys(fields) k where k not in ('author','body'))
     or length(btrim(coalesce(fields->>'author','')))<2 or length(fields->>'author')>80
     or length(btrim(coalesce(fields->>'body','')))<10 or length(fields->>'body')>2000)
  then raise exception 'INVALID_THOUGHT' using errcode='22023';end if;
  if resource='MEMORY' and
    (exists(select 1 from jsonb_object_keys(fields) k where k not in ('title','body'))
     or length(btrim(coalesce(fields->>'title','')))<2 or length(fields->>'title')>180
     or length(btrim(coalesce(fields->>'body','')))<10 or length(fields->>'body')>10000)
  then raise exception 'INVALID_MEMORY' using errcode='22023';end if;
 end if;
 if resource='THOUGHT' then
  if operation='CREATE' then
   insert into public.memorial_thoughts(memorial_id,is_demo,author_name,body,moderation_status)
   values(target_memorial,demo,fields->>'author',fields->>'body','PENDING') returning id into new_id;
  else
   select to_jsonb(t) into prior from public.memorial_thoughts t where t.id=record_id and t.memorial_id=target_memorial for update;
   if prior is null then raise exception 'THOUGHT_NOT_FOUND' using errcode='22023';end if;
   if operation='EDIT' then
    update public.memorial_thoughts set author_name=fields->>'author',body=fields->>'body' where id=record_id;
   elsif operation in ('APPROVE','REJECT') then
    update public.memorial_thoughts set moderation_status=case when operation='APPROVE' then 'APPROVED' else 'REJECTED' end where id=record_id;
   else delete from public.memorial_thoughts where id=record_id;end if;
   new_id:=record_id;
  end if;
  if operation<>'DELETE' then select to_jsonb(t) into after from public.memorial_thoughts t where t.id=new_id;end if;
 else
  if operation='CREATE' then
   insert into public.memorial_memories(memorial_id,is_demo,title,body,moderation_status)
   values(target_memorial,demo,fields->>'title',fields->>'body','PENDING') returning id into new_id;
  else
   select to_jsonb(m) into prior from public.memorial_memories m where m.id=record_id and m.memorial_id=target_memorial for update;
   if prior is null then raise exception 'MEMORY_NOT_FOUND' using errcode='22023';end if;
   if operation='EDIT' then
    update public.memorial_memories set title=fields->>'title',body=fields->>'body' where id=record_id;
   elsif operation in ('APPROVE','REJECT') then
    update public.memorial_memories set moderation_status=case when operation='APPROVE' then 'APPROVED' else 'REJECTED' end where id=record_id;
   else delete from public.memorial_memories where id=record_id;end if;
   new_id:=record_id;
  end if;
  if operation<>'DELETE' then select to_jsonb(m) into after from public.memorial_memories m where m.id=new_id;end if;
 end if;
 insert into public.memorial_presentation_audit(memorial_id,actor_id,action,old_values,new_values)
 values(target_memorial,actor,resource||'_'||operation||': '||left(reason,500),coalesce(prior,'{}'::jsonb),coalesce(after,'{}'::jsonb));
 return jsonb_build_object('id',new_id,'status',case when operation='DELETE' then 'DELETED' else after->>'moderation_status' end);
end $$;
revoke all on function public.platform_manage_memorial_contribution(uuid,text,uuid,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.platform_manage_memorial_contribution(uuid,text,uuid,text,jsonb,text) to authenticated;
