-- Legacy public Giovanni Rossi demo has no family publication token.
-- Its permanent QR may point to the existing public demonstration only;
-- no other memorial receives this exception.
create or replace function public.resolve_memorial_qr(code text)
returns jsonb language sql stable security definer set search_path=''
as $$
 select case
  when m.status='PUBLISHED_ACTIVE' and m.first_published_at is not null
   and m.covered_until>now() and m.public_token ~ '^[0-9a-f]{48}$'
   then jsonb_build_object('state','PUBLISHED','share_token',m.public_token)
  when m.id='bbbbbbbb-0000-4000-8000-000000000001'::uuid
   and m.is_demo and m.status='PUBLISHED_ACTIVE' and m.covered_until>now()
   and m.public_token is null
   then jsonb_build_object('state','LEGACY_DEMO')
  else jsonb_build_object('state','WAITING') end
 from public.memorials m
 where code ~ '^[0-9a-f]{32}$' and m.qr_code=code
 limit 1
$$;
revoke all on function public.resolve_memorial_qr(text) from public,anon,authenticated;
grant execute on function public.resolve_memorial_qr(text) to anon,authenticated;
