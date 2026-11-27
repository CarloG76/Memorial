-- Disposable CI assertion only; never run against live data.
do $$
begin
 if not exists(
  select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relname='payment_orders' and c.relrowsecurity
 ) then raise exception 'Payment order RLS missing'; end if;
 if not exists(
  select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relname='stripe_webhook_events' and c.relrowsecurity
 ) then raise exception 'Stripe event RLS missing'; end if;
 if has_table_privilege('anon','public.payment_orders','SELECT') or
    has_table_privilege('authenticated','public.payment_orders','SELECT') or
    has_table_privilege('anon','public.payment_orders','INSERT') or
    has_table_privilege('authenticated','public.payment_orders','UPDATE') then
  raise exception 'Payment orders exposed to client roles'; end if;
 if has_table_privilege('anon','public.stripe_webhook_events','SELECT') or
    has_table_privilege('authenticated','public.stripe_webhook_events','INSERT') then
  raise exception 'Stripe webhook ledger exposed to client roles'; end if;
 if has_function_privilege('anon',
  'public.stripe_apply_checkout_event(text,text,uuid,text,uuid,integer,text,text,boolean)','EXECUTE') or
    has_function_privilege('authenticated',
  'public.stripe_apply_checkout_event(text,text,uuid,text,uuid,integer,text,text,boolean)','EXECUTE') then
  raise exception 'Stripe event reconciler exposed'; end if;
 if not has_function_privilege('service_role',
  'public.stripe_apply_checkout_event(text,text,uuid,text,uuid,integer,text,text,boolean)','EXECUTE') then
  raise exception 'Service role missing reconciler permission'; end if;
end $$;
