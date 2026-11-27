-- MVP1B Stripe Sandbox: additive candidate migration. Do NOT apply to production until staging review.
-- The orders table is not exposed to browser roles; only trusted server actions may access it.
create table if not exists public.payment_orders (
 id uuid primary key default gen_random_uuid(),
 agency_id uuid not null references public.agencies(id),
 actor_user_id uuid not null references auth.users(id),
 request_key uuid not null,
 kind text not null default 'MEMORIAL' check (kind = 'MEMORIAL'),
 memorial_tier text not null check (memorial_tier in ('STANDARD','PREMIUM')),
 plan_code text not null check (plan_code = 'PAYG'),
 person_name text not null check (char_length(btrim(person_name)) between 3 and 180),
 family_email text not null check (char_length(family_email) between 3 and 254),
 amount_cents integer not null check (amount_cents in (1990,2290)),
 currency text not null default 'eur' check (currency = 'eur'),
 status text not null default 'CREATED' check (status in ('CREATED','CHECKOUT_OPEN','PAID','FAILED','EXPIRED')),
 stripe_session_id text unique,
 stripe_payment_intent_id text,
 stripe_paid_event_id text,
 fulfilment_status text not null default 'PENDING' check (fulfilment_status in ('PENDING','READY','FULFILLED')),
 memorial_id uuid unique references public.memorials(id),
 is_demo boolean not null default false check (is_demo = false),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 paid_at timestamptz,
 unique (agency_id, request_key),
 constraint order_tier_amount check (
  (memorial_tier = 'STANDARD' and amount_cents = 1990) or
  (memorial_tier = 'PREMIUM' and amount_cents = 2290)
 ),
 constraint paid_order_audit check (status <> 'PAID' or (paid_at is not null and stripe_paid_event_id is not null))
);
create index if not exists payment_orders_agency_recent on public.payment_orders(agency_id, created_at desc);
alter table public.payment_orders enable row level security;
revoke all on public.payment_orders from public, anon, authenticated;
grant select,insert,update on public.payment_orders to service_role;

create table if not exists public.stripe_webhook_events (
 event_id text primary key,
 event_type text not null,
 order_id uuid not null references public.payment_orders(id),
 stripe_session_id text not null,
 received_at timestamptz not null default now()
);
alter table public.stripe_webhook_events enable row level security;
revoke all on public.stripe_webhook_events from public, anon, authenticated;
grant select,insert on public.stripe_webhook_events to service_role;

-- Atomic transaction: verifies amount, ownership, session identity and event replay.
-- Public schema is used because PostgREST is limited to exposed RPC namespaces;
-- EXECUTE is restricted to service_role, never to anon/authenticated.
create or replace function public.stripe_apply_checkout_event(
 event_key text, event_kind text, order_key uuid, session_key text,
 agency_key uuid, paid_cents integer, paid_currency text,
 payment_state text, is_live boolean
) returns jsonb language plpgsql security invoker set search_path = ''
as $$
declare o public.payment_orders%rowtype;
begin
 if is_live or event_key !~ '^evt_' or session_key !~ '^cs_test_' then
  raise exception 'INVALID_SANDBOX_EVENT' using errcode='22023';
 end if;
 if event_kind not in ('checkout.session.completed','checkout.session.async_payment_succeeded',
                       'checkout.session.async_payment_failed','checkout.session.expired') then
  raise exception 'UNSUPPORTED_EVENT' using errcode='22023';
 end if;
 select * into o from public.payment_orders where id=order_key for update;
 if not found or o.agency_id <> agency_key then
  raise exception 'ORDER_NOT_FOUND' using errcode='42501';
 end if;
 if o.stripe_session_id is not null and o.stripe_session_id <> session_key then
  raise exception 'SESSION_MISMATCH' using errcode='22023';
 end if;
 if paid_cents is distinct from o.amount_cents or lower(coalesce(paid_currency,'')) <> o.currency then
  raise exception 'AMOUNT_MISMATCH' using errcode='22023';
 end if;
 insert into public.stripe_webhook_events(event_id,event_type,order_id,stripe_session_id)
 values(event_key,event_kind,order_key,session_key) on conflict(event_id) do nothing;
 if not found then return jsonb_build_object('replayed',true,'order_id',order_key,'status',o.status);end if;
 if event_kind in ('checkout.session.completed','checkout.session.async_payment_succeeded') and payment_state='paid' then
  update public.payment_orders set status='PAID',paid_at=coalesce(paid_at,now()),
   stripe_paid_event_id=coalesce(stripe_paid_event_id,event_key),
   stripe_session_id=coalesce(stripe_session_id,session_key),updated_at=now()
  where id=order_key and status <> 'PAID';
 elsif event_kind in ('checkout.session.expired','checkout.session.async_payment_failed') and o.status <> 'PAID' then
  update public.payment_orders set status=case when event_kind='checkout.session.expired' then 'EXPIRED' else 'FAILED' end,
   updated_at=now(),stripe_session_id=coalesce(stripe_session_id,session_key)
  where id=order_key;
 end if;
 return jsonb_build_object('replayed',false,'order_id',order_key,'verified',true);
end $$;
revoke all on function public.stripe_apply_checkout_event(text,text,uuid,text,uuid,integer,text,text,boolean)
 from public,anon,authenticated;
grant execute on function public.stripe_apply_checkout_event(text,text,uuid,text,uuid,integer,text,text,boolean) to service_role;
