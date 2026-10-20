# Supabase — migrazioni versionate

Schema Memorial applicato nel progetto `ojzkikhtcrqcpsvhepbp` al 20/10/2026 (UTC). La root `supabase/migrations/` contiene nomi corrispondenti a `supabase_migrations.schema_migrations` del progetto.

- `20261020215132_lock_down_rls_event_trigger_execute.sql`: REVOKE funzione preesistente (già applicata).
- `20261020220618_m1_identity_tenancy.sql`: schema M1, utenti/ruoli/tenancy, RLS.
- `20261020220643_m1_agency_onboarding.sql`: onboarding Free, documenti B2B e RPC.
- `20261020220855_m1_private_agency_registration_rpc.sql`: sposta RPC privilegiata nello schema privato e lascia wrapper public SECURITY INVOKER.

Le migrazioni già applicate sono **immutabili**: le modifiche successive richiedono nuove migrazioni additive, mai editare e rieseguire un file storico.

Test SQL in `supabase/tests` vengono eseguiti su PostgreSQL 17 effimero in GitHub Actions, non contro il DB Memorial. Non scrivere mai dati demo nel live durante i test. Gli SQL `14_SCHEMA.sql` e `15_RLS.sql` della documentazione sono preliminari e non vanno applicati automaticamente.
