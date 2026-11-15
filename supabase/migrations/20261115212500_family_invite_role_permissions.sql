-- Family invitation acceptance must never elevate a viewer to moderator/editor.
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
 values(invite_record.memorial_id,actor,invite_record.role,invite_record.role in ('OWNER','EDITOR'),invite_record.role in ('OWNER','EDITOR'),invite_record.role='OWNER',true,new_demo)
 on conflict(memorial_id,user_id) do update
 set active=true,
 can_moderate=public.family_members.can_moderate or (invite_record.role in ('OWNER','EDITOR')),
 can_edit_content=public.family_members.can_edit_content or (invite_record.role in ('OWNER','EDITOR')),
 can_view_contacts=public.family_members.can_view_contacts or (invite_record.role='OWNER');
 update public.family_invites set accepted_at=now() where id=invite_record.id;
 return jsonb_build_object('memorial_id',invite_record.memorial_id,'role',invite_record.role);
end $$;
