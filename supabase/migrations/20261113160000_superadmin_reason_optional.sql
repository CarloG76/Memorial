-- SuperAdmin edits no longer require a free-text reason. Keep owner checks, scoped contexts,
-- existing per-action audit and all field-level validation. RPC signatures unchanged.
-- Action log UI/extension is a separate subsequent milestone.

create or replace function public.platform_update_memorial_presentation(target_memorial uuid, changes jsonb, reason text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); old_row jsonb; new_row jsonb;
nm text; ded text; bio text; img text; focus_x integer;
begin
if actor is null or not exists(select 1 from public.platform_memberships pm where pm.user_id=actor and pm.role='OWNER' and pm.active)
then raise exception 'NOT_AUTHORIZED' using errcode='42501'; end if;
if target_memorial is null or changes is null or jsonb_typeof(changes)<>'object' or (reason is not null and length(reason)>500)
then raise exception 'INVALID_CHANGE' using errcode='22023'; end if;
if exists(select 1 from jsonb_object_keys(changes) k where k not in ('name','dedication','biography','portrait_url','portrait_focus_x'))
then raise exception 'UNSUPPORTED_FIELD' using errcode='22023'; end if;
select jsonb_build_object('name',m.deceased_name,'dedication',p.dedication,'biography',p.biography,
'portrait_url',p.portrait_url,'portrait_focus_x',p.portrait_focus_x)
into old_row from public.memorials m left join public.memorial_public_demo_profiles p on p.memorial_id=m.id
where m.id=target_memorial for update of m;
if old_row is null then raise exception 'MEMORIAL_NOT_FOUND' using errcode='22023'; end if;
nm:=coalesce(changes->>'name',old_row->>'name');ded:=coalesce(changes->>'dedication',old_row->>'dedication','');
bio:=coalesce(changes->>'biography',old_row->>'biography','');
img:=coalesce(changes->>'portrait_url',old_row->>'portrait_url','');
focus_x:=coalesce((changes->>'portrait_focus_x')::integer,(old_row->>'portrait_focus_x')::integer,42);
if length(btrim(nm))<3 or length(nm)>180 or length(ded)>500 or length(bio)>8000 or focus_x not between 0 and 100
or (img<>'' and img !~ '^/images/[A-Za-z0-9._-]+[.]((png)|(jpg)|(jpeg)|(webp))$')
then raise exception 'INVALID_PRESENTATION' using errcode='22023'; end if;
update public.memorials set deceased_name=nm where id=target_memorial;
insert into public.memorial_public_demo_profiles(memorial_id,dedication,biography,portrait_url,portrait_focus_x)
values(target_memorial,ded,bio,nullif(img,''),focus_x)
on conflict(memorial_id) do update set dedication=excluded.dedication,biography=excluded.biography,
portrait_url=excluded.portrait_url,portrait_focus_x=excluded.portrait_focus_x,updated_at=now();
new_row:=jsonb_build_object('name',nm,'dedication',ded,'biography',bio,'portrait_url',nullif(img,''),'portrait_focus_x',focus_x);
if old_row is distinct from new_row then insert into public.memorial_presentation_audit(memorial_id,actor_id,action,old_values,new_values)
values(target_memorial,actor,'PRESENTATION_UPDATED: '||coalesce(left(reason,500),''),old_row,new_row); end if;
return new_row;
end $$;

create or replace function public.platform_manage_memorial_contribution(
 target_memorial uuid,resource text,record_id uuid,operation text,fields jsonb,reason text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); prior jsonb;after jsonb;new_id uuid;demo boolean; st text;
begin
 if actor is null or not exists(select 1 from public.platform_memberships p where p.user_id=actor and p.role='OWNER' and p.active)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 if resource not in ('THOUGHT','MEMORY') or operation not in ('CREATE','EDIT','APPROVE','REJECT','DELETE')
 or (reason is not null and length(reason)>500)
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
 values(target_memorial,actor,resource||'_'||operation||': '||coalesce(left(reason,500),''),coalesce(prior,'{}'::jsonb),coalesce(after,'{}'::jsonb));
 return jsonb_build_object('id',new_id,'status',case when operation='DELETE' then 'DELETED' else after->>'moderation_status' end);
end $$;

create or replace function public.platform_override_memorial_background(target_memorial uuid,chosen_preset text,reason text)
returns text language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); old text;
begin
 if actor is null or not exists(select 1 from public.platform_memberships p where p.user_id=actor and p.role='OWNER' and p.active)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501'; end if;
 if not exists(select 1 from public.memorial_background_presets where id=chosen_preset and active)
 then raise exception 'INVALID_INPUT' using errcode='22023'; end if;
 if not exists(select 1 from public.memorials where id=target_memorial) then raise exception 'NOT_FOUND' using errcode='22023';end if;
 insert into public.memorial_visual_settings(memorial_id,updated_by) values(target_memorial,actor)
 on conflict(memorial_id) do nothing;
 select published_preset into old from public.memorial_visual_settings where memorial_id=target_memorial for update;
 update public.memorial_visual_settings set published_preset=chosen_preset,draft_preset=chosen_preset,published_by=actor,published_at=now(),updated_by=actor,updated_at=now() where memorial_id=target_memorial;
 if old is distinct from chosen_preset then
  insert into public.memorial_presentation_audit(memorial_id,actor_id,action,old_values,new_values)
  values(target_memorial,actor,'BACKGROUND_OVERRIDE: '||coalesce(left(reason,500),''),jsonb_build_object('preset',old),jsonb_build_object('preset',chosen_preset));
 end if;
 return chosen_preset;
end $$;

create or replace function public.platform_upsert_memorial_gallery_photo(target_memorial uuid,photo_id uuid,photo_title text,photo_subtitle text,photo_url text,photo_position integer,reason text)
returns uuid language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); original jsonb; changed jsonb; result uuid;
begin
 if actor is null or not exists(select 1 from public.platform_memberships p where p.user_id=actor and p.role='OWNER' and p.active)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501'; end if;
 if not exists(select 1 from public.memorials where id=target_memorial) then raise exception 'NOT_FOUND' using errcode='22023'; end if;
 if length(btrim(coalesce(photo_title,'')))<2 or length(photo_title)>120
 or length(coalesce(photo_subtitle,''))>350 or photo_position not between 1 and 99
 or not(photo_url ~ '^/images/[A-Za-z0-9._-]+[.]((png)|(jpg)|(jpeg)|(webp))$' or photo_url ~ '^https://images[.]unsplash[.]com/')
 then raise exception 'INVALID_INPUT' using errcode='22023'; end if;
 if photo_id is not null then
  select to_jsonb(p) into original from public.memorial_public_demo_photos p where p.id=photo_id and p.memorial_id=target_memorial for update;
  if original is null then raise exception 'PHOTO_NOT_FOUND' using errcode='22023'; end if;
  update public.memorial_public_demo_photos set title=photo_title,subtitle=coalesce(photo_subtitle,''),image_url=photo_url,position=photo_position where id=photo_id returning id into result;
 else
  insert into public.memorial_public_demo_photos(memorial_id,title,subtitle,image_url,position)
  values(target_memorial,photo_title,coalesce(photo_subtitle,''),photo_url,photo_position)
  returning id into result;
 end if;
 select to_jsonb(p) into changed from public.memorial_public_demo_photos p where p.id=result;
 insert into public.memorial_presentation_audit(memorial_id,actor_id,action,old_values,new_values)
 values(target_memorial,actor,'GALLERY_UPDATED: '||coalesce(left(reason,500),''),coalesce(original,'{}'::jsonb),changed);
 return result;
end $$;

create or replace function public.platform_delete_memorial_gallery_photo(target_memorial uuid,photo_id uuid,reason text)
returns boolean language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); original jsonb;
begin
 if actor is null or not exists(select 1 from public.platform_memberships p where p.user_id=actor and p.role='OWNER' and p.active)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501'; end if;
 if reason is not null and length(reason)>500 then raise exception 'INVALID_REASON' using errcode='22023';end if;
 delete from public.memorial_public_demo_photos p where p.id=photo_id and p.memorial_id=target_memorial returning to_jsonb(p) into original;
 if original is null then raise exception 'PHOTO_NOT_FOUND' using errcode='22023';end if;
 insert into public.memorial_presentation_audit(memorial_id,actor_id,action,old_values,new_values)
 values(target_memorial,actor,'GALLERY_DELETED: '||coalesce(left(reason,500),''),original,'{}'::jsonb);
 return true;
end $$;

create or replace function public.platform_context_update_agency(context_key uuid,changes jsonb,reason text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); ctx public.platform_operator_contexts%rowtype;
 old_row jsonb;new_row jsonb; nm text; ci text; em text;
begin
 if actor is null or not exists(select 1 from public.platform_memberships p where p.user_id=actor and p.role='OWNER' and p.active)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 select * into ctx from public.platform_operator_contexts c
 where c.id=context_key and c.actor_id=actor and c.context_type='AGENCY' and c.closed_at is null and c.expires_at>now() for update;
 if not found then raise exception 'CONTEXT_EXPIRED_OR_DENIED' using errcode='42501';end if;
 if changes is null or jsonb_typeof(changes)<>'object'
   or exists(select 1 from jsonb_object_keys(changes) k where k not in ('legal_name','city','contact_email'))
   or (reason is not null and length(reason)>500)
 then raise exception 'INVALID_CHANGE' using errcode='22023';end if;
 select jsonb_build_object('legal_name',legal_name,'city',city,'contact_email',contact_email)
 into old_row from public.agencies where id=ctx.agency_id for update;
 nm:=coalesce(changes->>'legal_name',old_row->>'legal_name');
 ci:=coalesce(changes->>'city',old_row->>'city');
 em:=coalesce(changes->>'contact_email',old_row->>'contact_email');
 if length(btrim(nm))<2 or length(nm)>240 or length(coalesce(ci,''))>150 or length(coalesce(em,''))>254
 or (coalesce(em,'')<>'' and em !~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$')
 then raise exception 'INVALID_AGENCY_PROFILE' using errcode='22023';end if;
 update public.agencies set legal_name=nm,city=nullif(ci,''),contact_email=nullif(em,'') where id=ctx.agency_id;
 select jsonb_build_object('legal_name',legal_name,'city',city,'contact_email',contact_email)
 into new_row from public.agencies where id=ctx.agency_id;
 if old_row is distinct from new_row then
 insert into public.platform_operator_context_events(context_id,actor_id,event_type,target_type,target_id,reason,before_data,after_data)
 values(ctx.id,actor,'AGENCY_PROFILE_UPDATED','AGENCY',ctx.agency_id,reason,old_row,new_row);
 end if;
 return new_row;
end $$;

create or replace function public.platform_context_update_family(context_key uuid,changes jsonb,reason text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid();ctx public.platform_operator_contexts%rowtype;result jsonb;before_row jsonb;
begin
 if actor is null or not exists(select 1 from public.platform_memberships p where p.user_id=actor and p.role='OWNER' and p.active)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 select * into ctx from public.platform_operator_contexts c
 where c.id=context_key and c.actor_id=actor and c.context_type='FAMILY' and c.closed_at is null and c.expires_at>now() for update;
 if not found then raise exception 'CONTEXT_EXPIRED_OR_DENIED' using errcode='42501';end if;
 select jsonb_build_object('name',m.deceased_name,'dedication',p.dedication,'biography',p.biography,
   'portrait_url',p.portrait_url,'portrait_focus_x',p.portrait_focus_x)
 into before_row from public.memorials m left join public.memorial_public_demo_profiles p on p.memorial_id=m.id where m.id=ctx.memorial_id;
 result:=public.platform_update_memorial_presentation(ctx.memorial_id,changes,reason);
 if before_row is distinct from result then
 insert into public.platform_operator_context_events(context_id,actor_id,event_type,target_type,target_id,reason,before_data,after_data)
 values(ctx.id,actor,'FAMILY_PRESENTATION_UPDATED','MEMORIAL',ctx.memorial_id,reason,before_row,result);
 end if;
 return result;
end $$;

create or replace function public.platform_context_moderate(context_key uuid,resource text,record_id uuid,operation text,fields jsonb,reason text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid();ctx public.platform_operator_contexts%rowtype; result jsonb;
begin
 if actor is null or not exists(select 1 from public.platform_memberships p where p.user_id=actor and p.role='OWNER' and p.active)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 select * into ctx from public.platform_operator_contexts c
 where c.id=context_key and c.actor_id=actor and c.context_type='FAMILY' and c.closed_at is null and c.expires_at>now() for update;
 if not found then raise exception 'CONTEXT_EXPIRED_OR_DENIED' using errcode='42501';end if;
 result:=public.platform_manage_memorial_contribution(ctx.memorial_id,resource,record_id,operation,coalesce(fields,'{}'::jsonb),reason);
 insert into public.platform_operator_context_events(context_id,actor_id,event_type,target_type,target_id,reason,after_data)
 values(ctx.id,actor,'FAMILY_'||resource||'_'||operation,'MEMORIAL',ctx.memorial_id,reason,
  jsonb_build_object('record_id',result->>'id','result',result->>'status'));
 return result;
end $$;

create or replace function public.platform_context_set_background(context_key uuid,preset text,reason text)
returns text language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid();ctx public.platform_operator_contexts%rowtype;prior text;changed text;
begin
 if actor is null or not exists(select 1 from public.platform_memberships p where p.user_id=actor and p.role='OWNER' and p.active)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 select * into ctx from public.platform_operator_contexts c
 where c.id=context_key and c.actor_id=actor and c.context_type='FAMILY' and c.closed_at is null and c.expires_at>now() for update;
 if not found then raise exception 'CONTEXT_EXPIRED_OR_DENIED' using errcode='42501';end if;
 select coalesce(v.published_preset,'montagna') into prior from public.memorials m
 left join public.memorial_visual_settings v on v.memorial_id=m.id where m.id=ctx.memorial_id;
 changed:=public.platform_override_memorial_background(ctx.memorial_id,preset,reason);
 if prior is distinct from changed then
 insert into public.platform_operator_context_events(context_id,actor_id,event_type,target_type,target_id,reason,before_data,after_data)
 values(ctx.id,actor,'FAMILY_BACKGROUND_UPDATED','MEMORIAL',ctx.memorial_id,reason,
 jsonb_build_object('preset',prior),jsonb_build_object('preset',changed));
 end if;
 return changed;
end $$;

