-- Agency owners may update non-fiscal contact details only, with audit.
create table if not exists public.agency_profile_changes(
 id uuid primary key default gen_random_uuid(),
 agency_id uuid not null references public.agencies(id),
 actor_id uuid not null,
 changes_before jsonb not null,
 changes_after jsonb not null,
 changed_at timestamptz not null default now()
);
alter table public.agency_profile_changes enable row level security;
revoke all on public.agency_profile_changes from public,anon,authenticated;

create or replace function public.agency_update_contact_profile(agency_key uuid,new_city text,new_contact_email text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); old_row jsonb; new_row jsonb; next_city text:=nullif(btrim(coalesce(new_city,'')),'');
next_email text:=nullif(lower(btrim(coalesce(new_contact_email,''))),'');
begin
 if actor is null or not exists(select 1 from public.agency_members am where am.user_id=actor and am.agency_id=agency_key and am.active and am.role='OWNER')
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 if length(coalesce(next_city,''))>150 or length(coalesce(next_email,''))>254
  or (next_email is not null and next_email !~* '^[A-Z0-9._%+\\-]+@[A-Z0-9.-]+[.][A-Z]{2,}$')
 then raise exception 'INVALID_CONTACT_DETAILS' using errcode='22023';end if;
 select jsonb_build_object('city',city,'contact_email',contact_email) into old_row
 from public.agencies where id=agency_key for update;
 if old_row is null then raise exception 'AGENCY_NOT_FOUND' using errcode='22023';end if;
 update public.agencies set city=next_city,contact_email=next_email where id=agency_key;
 new_row:=jsonb_build_object('city',next_city,'contact_email',next_email);
 if old_row is distinct from new_row then
  insert into public.agency_profile_changes(agency_id,actor_id,changes_before,changes_after)
  values(agency_key,actor,old_row,new_row);
 end if;
 return new_row;
end $$;
revoke all on function public.agency_update_contact_profile(uuid,text,text) from public,anon,authenticated;
grant execute on function public.agency_update_contact_profile(uuid,text,text) to authenticated;
