-- A printed QR must never silently change when other memorial fields are edited.
create or replace function public.prevent_memorial_qr_change()
returns trigger language plpgsql set search_path=''
as $$
begin
 if new.qr_code is distinct from old.qr_code then
  raise exception 'QR_CODE_IMMUTABLE' using errcode='23514';
 end if;
 return new;
end $$;
drop trigger if exists trg_memorial_qr_immutable on public.memorials;
create trigger trg_memorial_qr_immutable
before update of qr_code on public.memorials
for each row execute function public.prevent_memorial_qr_change();
