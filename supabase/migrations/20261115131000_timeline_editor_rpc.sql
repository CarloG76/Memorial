-- Life story is a timeline (highlights), not a second biography. The legacy story
-- text is kept only for backward compatibility and must not be rendered.
-- Existing highlights remain authoritative and continue to be restored by demo reset.
create or replace function public.platform_update_memorial_presentation(target_memorial uuid, changes jsonb, reason text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); old_row jsonb; new_row jsonb;
nm text; ded text; bio text; story_text text; img text; focus_x integer; milestones jsonb; milestone jsonb; date_text text;
begin
if actor is null or not exists(select 1 from public.platform_memberships pm where pm.user_id=actor and pm.role='OWNER' and pm.active)
then raise exception 'NOT_AUTHORIZED' using errcode='42501'; end if;
if target_memorial is null or changes is null or jsonb_typeof(changes)<>'object' or (reason is not null and length(reason)>500)
then raise exception 'INVALID_CHANGE' using errcode='22023'; end if;
if exists(select 1 from jsonb_object_keys(changes) k where k not in ('name','dedication','biography','story','highlights','portrait_url','portrait_focus_x'))
then raise exception 'UNSUPPORTED_FIELD' using errcode='22023'; end if;
select jsonb_build_object('name',m.deceased_name,'dedication',p.dedication,'biography',p.biography,'story',p.story,'highlights',p.highlights,
'portrait_url',p.portrait_url,'portrait_focus_x',p.portrait_focus_x)
into old_row from public.memorials m left join public.memorial_public_demo_profiles p on p.memorial_id=m.id
where m.id=target_memorial for update of m;
if old_row is null then raise exception 'MEMORIAL_NOT_FOUND' using errcode='22023'; end if;
nm:=coalesce(changes->>'name',old_row->>'name');ded:=coalesce(changes->>'dedication',old_row->>'dedication','');
bio:=coalesce(changes->>'biography',old_row->>'biography','');
story_text:=coalesce(changes->>'story',old_row->>'story','');
milestones:=coalesce(changes->'highlights',old_row->'highlights','[]'::jsonb);
if jsonb_typeof(milestones)<>'array' or jsonb_array_length(milestones)>30 then raise exception 'INVALID_TIMELINE' using errcode='22023';end if;
for milestone in select value from jsonb_array_elements(milestones) loop
 if jsonb_typeof(milestone)<>'object' or exists (select 1 from jsonb_object_keys(milestone) k where k not in ('date','year','title','detail'))
 then raise exception 'INVALID_TIMELINE_ITEM' using errcode='22023'; end if;
 date_text:=coalesce(milestone->>'date',milestone->>'year','');
 if (date_text !~ '^[0-9]{4}
img:=coalesce(changes->>'portrait_url',old_row->>'portrait_url','');
focus_x:=coalesce((changes->>'portrait_focus_x')::integer,(old_row->>'portrait_focus_x')::integer,42);
if length(btrim(nm))<3 or length(nm)>180 or length(ded)>500 or length(bio)>8000 or length(story_text)>16000 or focus_x not between 0 and 100
or (img<>'' and img !~ '^/images/[A-Za-z0-9._-]+[.]((png)|(jpg)|(jpeg)|(webp))$')
then raise exception 'INVALID_PRESENTATION' using errcode='22023'; end if;
update public.memorials set deceased_name=nm where id=target_memorial;
insert into public.memorial_public_demo_profiles(memorial_id,dedication,biography,story,highlights,portrait_url,portrait_focus_x)
values(target_memorial,ded,bio,story_text,milestones,nullif(img,''),focus_x)
on conflict(memorial_id) do update set dedication=excluded.dedication,biography=excluded.biography,story=excluded.story,highlights=excluded.highlights,
portrait_url=excluded.portrait_url,portrait_focus_x=excluded.portrait_focus_x,updated_at=now();
new_row:=jsonb_build_object('name',nm,'dedication',ded,'biography',bio,'story',story_text,'highlights',milestones,'portrait_url',nullif(img,''),'portrait_focus_x',focus_x);
if old_row is distinct from new_row then insert into public.memorial_presentation_audit(memorial_id,actor_id,action,old_values,new_values)
values(target_memorial,actor,'PRESENTATION_UPDATED: '||coalesce(left(reason,500),''),old_row,new_row); end if;
return new_row;
end $$; and date_text !~ '^(0[1-9]|1[0-2])-[0-9]{4}
img:=coalesce(changes->>'portrait_url',old_row->>'portrait_url','');
focus_x:=coalesce((changes->>'portrait_focus_x')::integer,(old_row->>'portrait_focus_x')::integer,42);
if length(btrim(nm))<3 or length(nm)>180 or length(ded)>500 or length(bio)>8000 or length(story_text)>16000 or focus_x not between 0 and 100
or (img<>'' and img !~ '^/images/[A-Za-z0-9._-]+[.]((png)|(jpg)|(jpeg)|(webp))$')
then raise exception 'INVALID_PRESENTATION' using errcode='22023'; end if;
update public.memorials set deceased_name=nm where id=target_memorial;
insert into public.memorial_public_demo_profiles(memorial_id,dedication,biography,story,portrait_url,portrait_focus_x)
values(target_memorial,ded,bio,story_text,nullif(img,''),focus_x)
on conflict(memorial_id) do update set dedication=excluded.dedication,biography=excluded.biography,story=excluded.story,
portrait_url=excluded.portrait_url,portrait_focus_x=excluded.portrait_focus_x,updated_at=now();
new_row:=jsonb_build_object('name',nm,'dedication',ded,'biography',bio,'story',story_text,'portrait_url',nullif(img,''),'portrait_focus_x',focus_x);
if old_row is distinct from new_row then insert into public.memorial_presentation_audit(memorial_id,actor_id,action,old_values,new_values)
values(target_memorial,actor,'PRESENTATION_UPDATED: '||coalesce(left(reason,500),''),old_row,new_row); end if;
return new_row;
end $$; and date_text !~ '^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-[0-9]{4}
img:=coalesce(changes->>'portrait_url',old_row->>'portrait_url','');
focus_x:=coalesce((changes->>'portrait_focus_x')::integer,(old_row->>'portrait_focus_x')::integer,42);
if length(btrim(nm))<3 or length(nm)>180 or length(ded)>500 or length(bio)>8000 or length(story_text)>16000 or focus_x not between 0 and 100
or (img<>'' and img !~ '^/images/[A-Za-z0-9._-]+[.]((png)|(jpg)|(jpeg)|(webp))$')
then raise exception 'INVALID_PRESENTATION' using errcode='22023'; end if;
update public.memorials set deceased_name=nm where id=target_memorial;
insert into public.memorial_public_demo_profiles(memorial_id,dedication,biography,story,portrait_url,portrait_focus_x)
values(target_memorial,ded,bio,story_text,nullif(img,''),focus_x)
on conflict(memorial_id) do update set dedication=excluded.dedication,biography=excluded.biography,story=excluded.story,
portrait_url=excluded.portrait_url,portrait_focus_x=excluded.portrait_focus_x,updated_at=now();
new_row:=jsonb_build_object('name',nm,'dedication',ded,'biography',bio,'story',story_text,'portrait_url',nullif(img,''),'portrait_focus_x',focus_x);
if old_row is distinct from new_row then insert into public.memorial_presentation_audit(memorial_id,actor_id,action,old_values,new_values)
values(target_memorial,actor,'PRESENTATION_UPDATED: '||coalesce(left(reason,500),''),old_row,new_row); end if;
return new_row;
end $$;)
 or right(date_text,4)='0000' or (length(date_text)=10 and to_char(to_date(date_text,'DD-MM-YYYY'),'DD-MM-YYYY')<>date_text)
 or length(coalesce(milestone->>'title',''))>180 or length(btrim(coalesce(milestone->>'detail','')))<1 or length(milestone->>'detail')>2000
 then raise exception 'INVALID_TIMELINE_ITEM' using errcode='22023';end if;
end loop;
img:=coalesce(changes->>'portrait_url',old_row->>'portrait_url','');
focus_x:=coalesce((changes->>'portrait_focus_x')::integer,(old_row->>'portrait_focus_x')::integer,42);
if length(btrim(nm))<3 or length(nm)>180 or length(ded)>500 or length(bio)>8000 or length(story_text)>16000 or focus_x not between 0 and 100
or (img<>'' and img !~ '^/images/[A-Za-z0-9._-]+[.]((png)|(jpg)|(jpeg)|(webp))$')
then raise exception 'INVALID_PRESENTATION' using errcode='22023'; end if;
update public.memorials set deceased_name=nm where id=target_memorial;
insert into public.memorial_public_demo_profiles(memorial_id,dedication,biography,story,portrait_url,portrait_focus_x)
values(target_memorial,ded,bio,story_text,nullif(img,''),focus_x)
on conflict(memorial_id) do update set dedication=excluded.dedication,biography=excluded.biography,story=excluded.story,
portrait_url=excluded.portrait_url,portrait_focus_x=excluded.portrait_focus_x,updated_at=now();
new_row:=jsonb_build_object('name',nm,'dedication',ded,'biography',bio,'story',story_text,'portrait_url',nullif(img,''),'portrait_focus_x',focus_x);
if old_row is distinct from new_row then insert into public.memorial_presentation_audit(memorial_id,actor_id,action,old_values,new_values)
values(target_memorial,actor,'PRESENTATION_UPDATED: '||coalesce(left(reason,500),''),old_row,new_row); end if;
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
 select jsonb_build_object('name',m.deceased_name,'dedication',p.dedication,'biography',p.biography,'story',p.story,'highlights',p.highlights,
   'portrait_url',p.portrait_url,'portrait_focus_x',p.portrait_focus_x)
 into before_row from public.memorials m left join public.memorial_public_demo_profiles p on p.memorial_id=m.id where m.id=ctx.memorial_id;
 result:=public.platform_update_memorial_presentation(ctx.memorial_id,changes,reason);
 if before_row is distinct from result then
 insert into public.platform_operator_context_events(context_id,actor_id,event_type,target_type,target_id,reason,before_data,after_data)
 values(ctx.id,actor,'FAMILY_PRESENTATION_UPDATED','MEMORIAL',ctx.memorial_id,reason,before_row,result);
 end if;
 return result;
end $$;

create or replace function public.platform_get_operator_context(context_key uuid)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); ctx public.platform_operator_contexts%rowtype; result jsonb;
begin
 if actor is null or not exists(select 1 from public.platform_memberships p where p.user_id=actor and p.role='OWNER' and p.active)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 select * into ctx from public.platform_operator_contexts c
 where c.id=context_key and c.actor_id=actor and c.closed_at is null and c.expires_at>now();
 if not found then raise exception 'CONTEXT_EXPIRED_OR_DENIED' using errcode='42501';end if;
 if ctx.context_type='AGENCY' then
 select jsonb_build_object(
  'context_id',ctx.id,'kind','AGENCY','expires_at',ctx.expires_at,
  'agency',jsonb_build_object('id',a.id,'legal_name',a.legal_name,'city',a.city,'country_code',a.country_code,
   'vat_number',a.vat_number,'contact_email',a.contact_email,'plan',a.plan,'status',a.status,'is_demo',a.is_demo),
  'memorials',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'name',m.deceased_name,'status',m.status,'tier',m.tier,'is_demo',m.is_demo)
    order by m.created_at desc) from public.memorials m where m.agency_id=a.id),'[]'::jsonb),
  'members',coalesce((select jsonb_agg(jsonb_build_object('user_id',am.user_id,'role',am.role,'active',am.active))
    from public.agency_members am where am.agency_id=a.id),'[]'::jsonb))
 into result from public.agencies a where a.id=ctx.agency_id;
 else
 select jsonb_build_object(
  'context_id',ctx.id,'kind','FAMILY','expires_at',ctx.expires_at,
  'memorial',jsonb_build_object('id',m.id,'agency_id',m.agency_id,'name',m.deceased_name,
     'tier',m.tier,'status',m.status,'visibility',m.visibility,'is_demo',m.is_demo,'birth_date',m.birth_date,'death_date',m.death_date),
  'agency',jsonb_build_object('id',a.id,'legal_name',a.legal_name),
  'presentation',jsonb_build_object('name',m.deceased_name,'dedication',coalesce(p.dedication,''),'biography',coalesce(p.biography,''),'story',coalesce(p.story,''),'highlights',coalesce(p.highlights,'[]'::jsonb),
     'portrait_url',p.portrait_url,'portrait_focus_x',p.portrait_focus_x,'background',coalesce(v.published_preset,'montagna')),
  'backgrounds',coalesce((select jsonb_agg(jsonb_build_object('id',b.id,'label',b.label,'image_url',b.image_url) order by b.sort_order)
     from public.memorial_background_presets b where b.active),'[]'::jsonb),
  'members',coalesce((select jsonb_agg(jsonb_build_object('user_id',fm.user_id,'role',fm.role,'active',fm.active,
     'can_moderate',fm.can_moderate,'can_edit_content',fm.can_edit_content))
     from public.family_members fm where fm.memorial_id=m.id),'[]'::jsonb),
  'thoughts',coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'author',t.author_name,'body',t.body,'status',t.moderation_status)
     order by t.created_at desc) from public.memorial_thoughts t where t.memorial_id=m.id),'[]'::jsonb),
  'memories',coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'title',r.title,'body',r.body,'status',r.moderation_status)
     order by r.created_at desc) from public.memorial_memories r where r.memorial_id=m.id),'[]'::jsonb))
 into result from public.memorials m
 join public.agencies a on a.id=m.agency_id
 left join public.memorial_public_demo_profiles p on p.memorial_id=m.id
 left join public.memorial_visual_settings v on v.memorial_id=m.id
 where m.id=ctx.memorial_id;
 end if;
 if result is null then raise exception 'TARGET_NOT_FOUND' using errcode='22023';end if;
 return result;
end $$;

create or replace function public.platform_get_memorial_presentation(target_memorial uuid)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare result jsonb;
begin
 if not exists(select 1 from public.platform_memberships pm where pm.user_id=auth.uid() and pm.role='OWNER' and pm.active)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501'; end if;
 select jsonb_build_object(
 'memorial_id',m.id,'name',m.deceased_name,'tier',m.tier,'status',m.status,'is_demo',m.is_demo,
 'dedication',coalesce(p.dedication,''),'biography',coalesce(p.biography,''),'story',coalesce(p.story,''),'highlights',coalesce(p.highlights,'[]'::jsonb),
 'portrait_url',coalesce(p.portrait_url,''),'portrait_focus_x',coalesce(p.portrait_focus_x,42),
 'background',coalesce(v.published_preset,'montagna'),
 'presets',coalesce((select jsonb_agg(jsonb_build_object('id',x.id,'label',x.label,'image_url',x.image_url) order by x.sort_order)
 from public.memorial_background_presets x where x.active),'[]'::jsonb),
 'photos',coalesce((select jsonb_agg(jsonb_build_object('id',x.id,'title',x.title,'subtitle',x.subtitle,'image_url',x.image_url,'position',x.position) order by x.position)
 from public.memorial_public_demo_photos x where x.memorial_id=m.id),'[]'::jsonb),
 'history',coalesce((select jsonb_agg(jsonb_build_object('actor',h.actor,'action',h.action,'before',h.old_values,'after',h.new_values,'at',h.at_time) order by h.at_time desc)
 from (
  select a.actor_id as actor,a.action,a.old_values,a.new_values,a.changed_at as at_time
  from public.memorial_presentation_audit a where a.memorial_id=m.id
  union all
  select a.actor_id,a.action,jsonb_build_object('preset',a.previous_preset),jsonb_build_object('preset',a.new_preset),a.happened_at
  from public.memorial_visual_audit a where a.memorial_id=m.id
 ) h),'[]'::jsonb))
 into result from public.memorials m
 left join public.memorial_public_demo_profiles p on p.memorial_id=m.id
 left join public.memorial_visual_settings v on v.memorial_id=m.id where m.id=target_memorial;
 return result;
end $$;
