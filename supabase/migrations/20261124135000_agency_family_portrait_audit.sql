-- Authorize and audit portrait updates performed in an explicit Agency → Family context.
create or replace function public.agency_family_set_memorial_portrait(memorial_key uuid, object_key text, context_key uuid)
returns text language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); new_path text; old_path text;
begin
 if public.memorial_publication_actor_type(memorial_key,context_key)<>'AGENCY_AS_FAMILY'
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 select portrait_url into old_path from public.memorial_public_demo_profiles where memorial_id=memorial_key;
 new_path:=public.set_memorial_portrait(memorial_key,object_key);
 insert into public.agency_family_operator_events(context_id,actor_id,action,memorial_id,data)
 values(context_key,actor,'FAMILY_PORTRAIT_UPDATED',memorial_key,
   jsonb_build_object('previous_url',old_path,'new_url',new_path));
 return new_path;
end $$;
revoke all on function public.agency_family_set_memorial_portrait(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.agency_family_set_memorial_portrait(uuid,text,uuid) to authenticated;
