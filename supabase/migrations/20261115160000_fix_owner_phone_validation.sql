-- Correct escaped + sign in E.164-ish phone validation.
alter table public.agency_owner_contacts drop constraint if exists agency_owner_contacts_phone_check;
alter table public.agency_owner_contacts add constraint agency_owner_contacts_phone_check
 check(phone ~ '^\+[1-9][0-9 ()-]{6,23}$');

create or replace function public.agency_save_owner_contact(
 agency_key uuid,owner_key uuid,first_name text,last_name text,phone text,email text,
 context_key uuid default null)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); result jsonb;
begin
 if not app_private.can_manage_agency_team(agency_key,context_key)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 if not exists(select 1 from public.agency_members am
    where am.agency_id=agency_key and am.user_id=owner_key and am.role='OWNER')
 then raise exception 'TARGET_NOT_OWNER' using errcode='22023';end if;
 -- An agency owner can only edit their own personal contact details. Contextual SuperAdmin can edit any owner.
 if actor<>owner_key and not (context_key is not null and exists(
  select 1 from public.platform_memberships pm where pm.user_id=actor and pm.role='OWNER' and pm.active))
 then raise exception 'CONTACT_OWNER_MISMATCH' using errcode='42501';end if;
 if first_name is null or last_name is null or phone is null or email is null or
    char_length(btrim(first_name)) not between 2 and 100 or
    char_length(btrim(last_name)) not between 2 and 100 or
    phone !~ '^\+[1-9][0-9 ()-]{6,23}$' or
    email !~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' or char_length(email)>254
 then raise exception 'INVALID_OWNER_CONTACT' using errcode='22023';end if;
 insert into public.agency_owner_contacts(agency_id,user_id,first_name,last_name,phone,email)
 values(agency_key,owner_key,btrim(first_name),btrim(last_name),btrim(phone),lower(btrim(email)))
 on conflict(agency_id,user_id) do update set
 first_name=excluded.first_name,last_name=excluded.last_name,phone=excluded.phone,
 email=excluded.email,updated_at=now();
 return jsonb_build_object('saved',true);
end $$;