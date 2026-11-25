-- MEMORIAL: immutable, print-safe QR identifier distinct from mutable public access token.
-- Default for new memorials and backfill for existing records.
alter table public.memorials add column if not exists qr_code text;
update public.memorials set qr_code=encode(extensions.gen_random_bytes(16),'hex') where qr_code is null;
alter table public.memorials alter column qr_code set default encode(extensions.gen_random_bytes(16),'hex');
alter table public.memorials alter column qr_code set not null;
create unique index if not exists memorials_qr_code_unique on public.memorials(qr_code);
alter table public.memorials add constraint memorials_qr_code_shape check(qr_code ~ '^[0-9a-f]{32}$');

create or replace function public.get_memorial_qr(target_memorial uuid,context_key uuid default null)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); result jsonb;
begin
 if actor is null then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 select jsonb_build_object('qr_code',m.qr_code,'memorial_id',m.id,'status',m.status)
 into result from public.memorials m
 where m.id=target_memorial and (
   exists(select 1 from public.family_members f where f.memorial_id=m.id and f.user_id=actor and f.active)
   or exists(select 1 from public.agency_members a where a.agency_id=m.agency_id and a.user_id=actor and a.active and a.role in ('OWNER','OPERATOR'))
   or exists(select 1 from public.platform_memberships p where p.user_id=actor and p.active and p.role='OWNER')
 );
 if result is null then raise exception 'NOT_AUTHORIZED' using errcode='42501';end if;
 return result;
end $$;

-- Public QR resolver reveals no identity or details until first publication.
-- It checks publication and coverage on each scan so the QR survives token rotation.
create or replace function public.resolve_memorial_qr(code text)
returns jsonb language sql stable security definer set search_path=''
as $$
 select case when m.status='PUBLISHED_ACTIVE'
                  and m.first_published_at is not null
                  and m.covered_until>now()
                  and m.public_token ~ '^[0-9a-f]{48}$'
   then jsonb_build_object('state','PUBLISHED','share_token',m.public_token)
   else jsonb_build_object('state','WAITING') end
 from public.memorials m
 where code ~ '^[0-9a-f]{32}$' and m.qr_code=code
 limit 1
$$;

revoke all on function public.get_memorial_qr(uuid,uuid), public.resolve_memorial_qr(text) from public,anon,authenticated;
grant execute on function public.get_memorial_qr(uuid,uuid) to authenticated;
grant execute on function public.resolve_memorial_qr(text) to anon,authenticated;
