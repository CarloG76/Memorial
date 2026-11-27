-- MVP0: explicit delegation required for an agency to update a family portrait.
-- Additive security hardening. Review and apply on Supabase staging before production.
--
-- Before this migration any active agency member could upload an object and call
-- set_memorial_portrait() directly, bypassing the delegated context and its audit.
-- Agency operators must now enter a time-limited, logged family context.

-- Storage INSERT must not depend on direct SELECT access to the private
-- context table. This narrow boolean helper uses auth.uid(), never user_metadata.
create or replace function public.can_upload_memorial_portrait(target_memorial uuid)
returns boolean language sql stable security definer set search_path=''
as $$
 select auth.uid() is not null and exists (
  select 1 from public.memorials m
  where m.id=target_memorial and (
   exists (
    select 1 from public.family_members fm
    where fm.memorial_id=m.id and fm.user_id=auth.uid() and fm.active
      and (fm.role='OWNER' or (fm.role='EDITOR' and fm.can_edit_content))
   )
   or exists (
    select 1 from public.platform_memberships pm
    where pm.user_id=auth.uid() and pm.role='OWNER' and pm.active
   )
   or exists (
    select 1
    from public.agency_family_operator_contexts c
    join public.agency_members am on am.agency_id=c.agency_id
      and am.user_id=c.actor_id and am.active and am.role in ('OWNER','OPERATOR')
    where c.actor_id=auth.uid() and c.agency_id=m.agency_id
      and c.memorial_id=m.id and c.closed_at is null and c.expires_at>now()
   )
  )
 );
$$;
revoke all on function public.can_upload_memorial_portrait(uuid) from public, anon, authenticated;
grant execute on function public.can_upload_memorial_portrait(uuid) to authenticated;

drop policy if exists "authorized_memorial_portrait_upload" on storage.objects;
create policy "authorized_memorial_portrait_upload" on storage.objects
for insert to authenticated
with check (
 bucket_id='memorial-portraits'
 and case when name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}[.](jpg|png|webp)$'
  then public.can_upload_memorial_portrait(split_part(name,'/',1)::uuid)
  else false end
);

-- Direct portrait RPC is intentionally family/editor or PLATFORM OWNER only.
-- It never accepts an agency-member role without a delegation key.
create or replace function public.set_memorial_portrait(memorial_key uuid, object_key text)
returns text language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); new_path text;
begin
 if actor is null or not (
  exists (
   select 1 from public.family_members fm
   where fm.memorial_id=memorial_key and fm.user_id=actor and fm.active
    and (fm.role='OWNER' or (fm.role='EDITOR' and fm.can_edit_content))
  )
  or exists (
   select 1 from public.platform_memberships pm
   where pm.user_id=actor and pm.role='OWNER' and pm.active
  )
 ) then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 if not exists(select 1 from public.memorials where id=memorial_key for update)
 then raise exception 'MEMORIAL_NOT_FOUND' using errcode='22023';end if;
 if object_key is null
  or object_key !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}[.](jpg|png|webp)$'
  or split_part(object_key,'/',1)<>memorial_key::text
  or not exists(select 1 from storage.objects where bucket_id='memorial-portraits' and name=object_key)
 then raise exception 'INVALID_PORTRAIT_OBJECT' using errcode='22023';end if;
 new_path:='/storage/v1/object/public/memorial-portraits/'||object_key;
 insert into public.memorial_public_demo_profiles(memorial_id,dedication,biography,story,highlights,portrait_url)
 values(memorial_key,'','','','[]'::jsonb,new_path)
 on conflict(memorial_id) do update set portrait_url=excluded.portrait_url,updated_at=now();
 return new_path;
end $$;
revoke all on function public.set_memorial_portrait(uuid,text) from public,anon,authenticated;
grant execute on function public.set_memorial_portrait(uuid,text) to authenticated;

-- Agency delegation remains operative, with explicit context validation and audit.
-- Do not invoke the direct RPC: that deliberately excludes agency-only actors.
create or replace function public.agency_family_set_memorial_portrait(
 memorial_key uuid, object_key text, context_key uuid
)
returns text language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); new_path text; old_path text;
begin
 if context_key is null
  or public.memorial_publication_actor_type(memorial_key,context_key)<>'AGENCY_AS_FAMILY'
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 if not exists(select 1 from public.memorials where id=memorial_key for update)
 then raise exception 'MEMORIAL_NOT_FOUND' using errcode='22023';end if;
 if object_key is null
  or object_key !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}[.](jpg|png|webp)$'
  or split_part(object_key,'/',1)<>memorial_key::text
  or not exists(select 1 from storage.objects where bucket_id='memorial-portraits' and name=object_key)
 then raise exception 'INVALID_PORTRAIT_OBJECT' using errcode='22023';end if;
 select portrait_url into old_path
 from public.memorial_public_demo_profiles where memorial_id=memorial_key;
 new_path:='/storage/v1/object/public/memorial-portraits/'||object_key;
 insert into public.memorial_public_demo_profiles(memorial_id,dedication,biography,story,highlights,portrait_url)
 values(memorial_key,'','','','[]'::jsonb,new_path)
 on conflict(memorial_id) do update set portrait_url=excluded.portrait_url,updated_at=now();
 insert into public.agency_family_operator_events(context_id,actor_id,action,memorial_id,data)
 values(context_key,actor,'FAMILY_PORTRAIT_UPDATED',memorial_key,
  jsonb_build_object('previous_url',old_path,'new_url',new_path));
 return new_path;
end $$;
revoke all on function public.agency_family_set_memorial_portrait(uuid,text,uuid)
 from public,anon,authenticated;
grant execute on function public.agency_family_set_memorial_portrait(uuid,text,uuid)
 to authenticated;
