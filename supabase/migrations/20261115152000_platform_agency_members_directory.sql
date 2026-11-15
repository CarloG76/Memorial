-- OWNER-only directory for the SuperAdmin's read-only agency detail page.
-- Contact details are returned only to an authenticated PLATFORM_OWNER.
create or replace function public.platform_agency_members_directory(agency_key uuid)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare result jsonb;
begin
 if auth.uid() is null or not exists(
   select 1 from public.platform_memberships pm
   where pm.user_id=auth.uid() and pm.role='OWNER' and pm.active
 ) then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 if not exists(select 1 from public.agencies where id=agency_key)
 then raise exception 'AGENCY_NOT_FOUND' using errcode='22023';end if;
 select coalesce(jsonb_agg(jsonb_build_object(
  'user_id',am.user_id,'role',am.role,'active',am.active,
  'display_name',coalesce(p.display_name,''),
  'first_name',coalesce(c.first_name,''),
  'last_name',coalesce(c.last_name,''),
  'phone',coalesce(c.phone,''),
  'contact_email',coalesce(c.email,''),
  'login_email',coalesce(u.email,''),
  'contact_complete',c.user_id is not null
 ) order by case when am.role='OWNER' then 0 else 1 end,coalesce(u.email,'')), '[]'::jsonb)
 into result from public.agency_members am
 left join public.profiles p on p.user_id=am.user_id
 left join public.agency_owner_contacts c on c.agency_id=am.agency_id and c.user_id=am.user_id
 left join auth.users u on u.id=am.user_id
 where am.agency_id=agency_key;
 return result;
end $$;
revoke all on function public.platform_agency_members_directory(uuid) from public,anon,authenticated;
grant execute on function public.platform_agency_members_directory(uuid) to authenticated;
