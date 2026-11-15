-- A real agency can activate two no-charge memorials once, transactionally.
-- Subsequent memorials must be paid through the future verified Stripe checkout.
create or replace function public.agency_create_free_memorial(
 agency_key uuid, person_name text, memorial_tier text, family_email text,context_key uuid default null)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); agency_record public.agencies%rowtype; remaining int;
 recipient text:=lower(btrim(coalesce(family_email,''))); name_text text:=btrim(coalesce(person_name,''));
 token text; target uuid; invite_id uuid;
begin
 if actor is null then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 if not (
  exists(select 1 from public.agency_members am where am.user_id=actor and am.agency_id=agency_key and am.active and context_key is null)
  or exists(select 1 from public.platform_operator_contexts ctx join public.platform_memberships pm on pm.user_id=ctx.actor_id
   where pm.user_id=actor and pm.role='OWNER' and pm.active and ctx.id=context_key
   and ctx.agency_id=agency_key and ctx.context_type='AGENCY'
   and ctx.closed_at is null and ctx.expires_at>now())
 ) then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 if char_length(name_text) not between 3 and 180 or memorial_tier not in ('STANDARD','PREMIUM')
  or char_length(recipient)>254 or recipient !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
 then raise exception 'INVALID_MEMORIAL_DATA' using errcode='22023';end if;
 select * into agency_record from public.agencies a where a.id=agency_key for update;
 if not found or agency_record.status<>'ACTIVE' then raise exception 'AGENCY_NOT_ACTIVE' using errcode='42501';end if;
 select total-used into remaining from public.agency_free_entitlements f where f.agency_id=agency_key for update;
 if remaining is null then raise exception 'FREE_ENTITLEMENTS_NOT_CONFIGURED' using errcode='22023';end if;
 if remaining<1 then raise exception 'PAYMENT_REQUIRED' using errcode='22023';end if;
 if agency_record.is_demo then raise exception 'DEMO_AGENCY_TRIAL_NOT_CONFIGURED' using errcode='22023';end if;
 insert into public.memorials(agency_id,is_demo,tier,status,visibility,deceased_name,covered_until)
 values(agency_key,false,memorial_tier,'SKELETON_ACTIVE','UNLISTED',name_text,null) returning id into target;
 update public.agency_free_entitlements f set used=used+1 where f.agency_id=agency_key;
 insert into public.agency_free_memorial_activations(memorial_id,agency_id,created_by)
 values(target,agency_key,actor);
 token:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
 insert into public.family_invites(memorial_id,invited_email,role,token_hash,expires_at,is_demo)
 values(target,recipient,'OWNER',encode(sha256(convert_to(token,'UTF8')),'hex'),now()+interval '72 hours',false)
 returning id into invite_id;
 return jsonb_build_object('memorial_id',target,'family_invite_token',token,'family_invite_id',invite_id,
 'family_email',recipient,'free_remaining',remaining-1,'tier',memorial_tier);
end $$;

create or replace function public.accept_family_invitation(invitation_token text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); email_text text; verified timestamptz;
 invite_record public.family_invites%rowtype; new_demo boolean;
begin
 if actor is null or invitation_token !~ '^[a-f0-9]{64}$' then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 select lower(email),email_confirmed_at into email_text,verified from auth.users where id=actor;
 if verified is null then raise exception 'EMAIL_NOT_VERIFIED' using errcode='42501';end if;
 select * into invite_record from public.family_invites
 where token_hash=encode(sha256(convert_to(invitation_token,'UTF8')),'hex') for update;
 if not found or invite_record.accepted_at is not null or invite_record.revoked_at is not null
 or invite_record.expires_at<=now() or invite_record.invited_email<>email_text
 then raise exception 'INVITATION_EXPIRED_OR_INVALID' using errcode='42501';end if;
 select is_demo into new_demo from public.memorials where id=invite_record.memorial_id;
 if not found then raise exception 'MEMORIAL_NOT_FOUND' using errcode='22023';end if;
 insert into public.family_members(memorial_id,user_id,role,can_moderate,can_edit_content,can_view_contacts,active,is_demo)
 values(invite_record.memorial_id,actor,invite_record.role,true,true,true,true,new_demo)
 on conflict(memorial_id,user_id) do update
 set active=true,can_moderate=true,can_edit_content=true,can_view_contacts=true;
 update public.family_invites set accepted_at=now() where id=invite_record.id;
 return jsonb_build_object('memorial_id',invite_record.memorial_id,'role',invite_record.role);
end $$;

revoke all on function public.agency_create_free_memorial(uuid,text,text,text,uuid) from public,anon,authenticated;
revoke all on function public.accept_family_invitation(text) from public,anon,authenticated;
grant execute on function public.agency_create_free_memorial(uuid,text,text,text,uuid) to authenticated;
grant execute on function public.accept_family_invitation(text) to authenticated;
