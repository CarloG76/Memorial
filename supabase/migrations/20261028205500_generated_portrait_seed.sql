-- Initial image import by the platform operator on explicit SuperAdmin request.
-- System maintenance events must never impersonate a signed-in user.
alter table public.memorial_presentation_audit alter column actor_id drop not null;
do $$
declare mid uuid; before_row jsonb; after_row jsonb;
begin
 select memorial_id into mid from public.memorial_demo_slots where slot='visitor_preview';
 if mid is null then raise exception 'DEMO_SLOT_NOT_FOUND'; end if;
 select jsonb_build_object('portrait_url',portrait_url,'portrait_focus_x',portrait_focus_x)
 into before_row from public.memorial_public_demo_profiles where memorial_id=mid for update;
 update public.memorial_public_demo_profiles
 set portrait_url='/images/giovanni-hero-2026.webp',portrait_focus_x=42,updated_at=now()
 where memorial_id=mid;
 select jsonb_build_object('portrait_url',portrait_url,'portrait_focus_x',portrait_focus_x)
 into after_row from public.memorial_public_demo_profiles where memorial_id=mid;
 if before_row is distinct from after_row then
 insert into public.memorial_presentation_audit(memorial_id,actor_id,action,old_values,new_values)
 values(mid,null,'SYSTEM_IMAGE_IMPORT: new virtual portrait on SuperAdmin request',before_row,after_row);
 end if;
end $$;