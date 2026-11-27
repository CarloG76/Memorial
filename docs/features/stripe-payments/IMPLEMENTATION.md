# Stripe Sandbox — Embedded card payments (MVP 1B)

## Status — 27 November 2026
**Implemented on isolated `feature/stripe-payments`, NOT enabled in production.**
The client stays on MEMORIAL; Stripe.js renders the secure card Payment Element inside the existing agency purchase view.

### Implemented
- Sandbox-only test keys (`sk_test_`, `pk_test_`); both feature flags default to false.
- New real-agency PAYG card checkout after the **two free activations are exhausted**. Demo agencies cannot create real payments.
- Authenticated agency OWNER validation, active real agency validation, server-controlled tier and amount, server-side free-entitlement check.
- Persistent order with agency/request idempotency key and unique Stripe Checkout Session.
- Stripe Checkout Sessions API with `ui_mode=elements`, payment method restricted to card, EUR €19.90 Standard / €22.90 Premium in test mode.
- Browser payment details go directly to Stripe.js; never store full PAN, CVC, payment method data or publish secret keys.
- Raw request-body webhook HMAC verification, 5-minute timestamp tolerance, Stripe event deduplication, transactionally checked order + agency + session + amount + currency.
- Out-of-order expiry/failure cannot downgrade a previously `PAID` order.
- A successful payment marks the order `PAID` with `fulfilment_status=PENDING`; **it does not yet create a memorial, family invitation, subscription or invoice**.

### REQUIRED before any Sandbox end-to-end execution
1. Provision an isolated **Supabase staging project**, not the existing Memorial production database. Apply `supabase/migrations/20261127111000_stripe_sandbox_orders.sql` only after review.
2. On the Vercel Preview for this branch, configure server-only `SUPABASE_SECRET_KEY` for the SAME staging Supabase project, `STRIPE_SECRET_KEY=sk_test_...`, `STRIPE_WEBHOOK_SECRET=whsec_...`, and public `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...`.
3. Configure both `STRIPE_SANDBOX_ENABLED=true` and `NEXT_PUBLIC_STRIPE_SANDBOX_ENABLED=true` ONLY on staging Preview after database setup. Publish `/api/payments/stripe/webhook` in the Stripe Sandbox webhook destination.
4. Configure a verified test agency with an active OWNER and used=2 of total=2 free entitlements. Avoid production personal information.
5. Exercise card 4242 4242 4242 4242 and error scenarios with Stripe test cards. Check actual Stripe Sandbox events, signed webhooks and order states.

### Design constraints
- Tax treatment, invoicing, fiscal policies and catalog versioning are pending business/legal confirmation. Sandbox amounts are **demonstrations**, not approved VAT-inclusive live invoices.
- Subscription Pro monthly/annual remains outside this first PAYG checkout tranche and requires recurring Stripe subscription lifecycle, customer and invoice ledger.
- Do not infer completion/fulfilment from the browser return URL; only a verified webhook can mark an order paid.
- Implement separately: transactional paid-order fulfilment (create skeleton + family invitation exactly once), status display / reconciliation, failed order retry/recovery, subscription lifecycle and fiscal readiness.
- For production activation, remove the sandbox-only block only through a separate, reviewed change. Never replace `sk_test_` with a live key while these safeguards remain the only gate.

## Endpoints
- `POST /api/payments/stripe/checkout`: cookie-authenticated account OWNER, POST only, order created before Stripe session; returns client secret for Stripe.js. Returns 503 while disabled.
- `POST /api/payments/stripe/webhook`: verifies raw signed Stripe event; idempotent database RPC. Returns 400 for invalid signature and 5xx to allow retries on database errors.

## Rollback
Disable both flags in Vercel Preview. Leave historical orders and webhook events intact for audit. No production schema changes have been applied by creating this branch. Removing tables while active checkouts exist is **not** a safe rollback.

## Definition of Done pending
- [ ] Staging schema applied and RLS verification completed
- [ ] End-to-end card test and declines / 3DS handling
- [ ] Replayed and out-of-order Stripe events tested against staging database
- [ ] Paid order fulfilment + family invite transaction
- [ ] Secure order status UI and timeout recovery
- [ ] Pro subscriptions / cancellation / renewal handling
- [ ] VAT / invoice workflow and business sign-off
- [ ] Browser screenshots in desktop/tablet/mobile, then final UAT after all MVP development
