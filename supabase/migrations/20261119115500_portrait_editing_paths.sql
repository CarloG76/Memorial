-- Trust uploaded portrait paths when saving biographies.
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
 if (date_text !~ '^[0-9]{4}$' and date_text !~ '^(0[1-9]|1[0-2])-[0-9]{4}$' and date_text !~ '^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-[0-9]{4}$')
 or right(date_text,4)='0000' or (length(date_text)=10 and to_char(to_date(date_text,'DD-MM-YYYY'),'DD-MM-YYYY')<>date_text)
 or length(coalesce(milestone->>'title',''))>180 or length(btrim(coalesce(milestone->>'detail','')))<1 or length(milestone->>'detail')>2000
 then raise exception 'INVALID_TIMELINE_ITEM' using errcode='22023';end if;
end loop;
img:=coalesce(changes->>'portrait_url',old_row->>'portrait_url','');
focus_x:=coalesce((changes->>'portrait_focus_x')::integer,(old_row->>'portrait_focus_x')::integer,42);
if length(btrim(nm))<3 or length(nm)>180 or length(ded)>500 or length(bio)>8000 or length(story_text)>16000 or focus_x not between 0 and 100
or (img<>'' and img !~ '^/images/[A-Za-z0-9._-]+[.]((png)|(jpg)|(jpeg)|(webp))$' and img !~ '^/storage/v1/object/public/memorial-portraits/[0-9a-f-]{36}/[0-9a-f-]{36}[.](jpg|png|webp)$')
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
end $$;

create or replace function public.family_save_memorial_editor(target_memorial uuid, changes jsonb, reason text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); old_row jsonb; new_row jsonb;
nm text; ded text; bio text; story_text text; img text; focus_x integer; milestones jsonb; milestone jsonb; date_text text;
begin
if actor is null or not exists(
 select 1 from public.family_members fm where fm.user_id=actor and fm.memorial_id=target_memorial
 and fm.active and (fm.role='OWNER' or (fm.role='EDITOR' and fm.can_edit_content))
) then raise exception 'NOT_AUTHORIZED' using errcode='42501'; end if;
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
 if (date_text !~ '^[0-9]{4}$' and date_text !~ '^(0[1-9]|1[0-2])-[0-9]{4}$' and date_text !~ '^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-[0-9]{4}$')
 or right(date_text,4)='0000' or (length(date_text)=10 and to_char(to_date(date_text,'DD-MM-YYYY'),'DD-MM-YYYY')<>date_text)
 or length(coalesce(milestone->>'title',''))>180 or length(btrim(coalesce(milestone->>'detail','')))<1 or length(milestone->>'detail')>2000
 then raise exception 'INVALID_TIMELINE_ITEM' using errcode='22023';end if;
end loop;
img:=coalesce(changes->>'portrait_url',old_row->>'portrait_url','');
focus_x:=coalesce((changes->>'portrait_focus_x')::integer,(old_row->>'portrait_focus_x')::integer,42);
if length(btrim(nm))<3 or length(nm)>180 or length(ded)>500 or length(bio)>8000 or length(story_text)>16000 or focus_x not between 0 and 100
or (img<>'' and img !~ '^/images/[A-Za-z0-9._-]+[.]((png)|(jpg)|(jpeg)|(webp))$' and img !~ '^/storage/v1/object/public/memorial-portraits/[0-9a-f-]{36}/[0-9a-f-]{36}[.](jpg|png|webp)$')
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
end $$;
