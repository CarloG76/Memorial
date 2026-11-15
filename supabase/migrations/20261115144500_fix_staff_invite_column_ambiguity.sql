create or replace function public.agency_invite_operator(
 agency_key uuid,invited_email text, context_key uuid default null)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare email_normal text:=lower(btrim(coalesce(invited_email,'')));
 raw_token text; invite_id uuid; demo boolean;
begin
 if not app_private.can_manage_agency_team(agency_key,context_key)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 if char_length(email_normal)>254 or email_normal !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
 then raise exception 'INVALID_EMAIL' using errcode='22023';end if;
 if (select count(*) from public.agency_operator_invites i where i.agency_id=agency_key
    and i.accepted_at is null and i.revoked_at is null and i.expires_at>now())>=20
 then raise exception 'TOO_MANY_PENDING_INVITES' using errcode='22023';end if;
 if exists(select 1 from public.agency_members am
    join auth.users u on u.id=am.user_id
    where am.agency_id=agency_key and lower(u.email)=email_normal and am.active)
 then raise exception 'ALREADY_MEMBER' using errcode='22023';end if;
 select is_demo into demo from public.agencies where id=agency_key;
 if not found then raise exception 'AGENCY_NOT_FOUND' using errcode='22023';end if;
 update public.agency_operator_invites i set revoked_at=now()
 where i.agency_id=agency_key and i.invited_email=email_normal
   and i.accepted_at is null and i.revoked_at is null;
 raw_token:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
 insert into public.agency_operator_invites(agency_id,invited_email,token_hash,created_by,is_demo)
 values(agency_key,email_normal,encode(sha256(convert_to(raw_token,'UTF8')),'hex'),auth.uid(),demo)
 returning id into invite_id;
 return jsonb_build_object('id',invite_id,'token',raw_token,'email',email_normal);
end $$;