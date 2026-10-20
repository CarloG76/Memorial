# M1 — Registro verifiche

**Data:** 20 ottobre 2026.

| Ambito | Esito | Evidenza |
|---|---|---|
| Audit fonti ufficiali (priorità a 01_DECISIONI) | ESEGUITO | `docs/milestones/M1/IMPLEMENTATION.md` |
| Migrazione M1 preparata e versionata | CODIFICATA | `supabase/migrations/20261020190000_m1_identity_tenancy.sql` |
| RLS SQL: grants, ruoli, cross-tenant, inviti, SuperAdmin singleton | CODIFICATI, DA VERIFICARE IN CI | `supabase/tests/M1_*.sql`, `RLS_TEST_MATRIX.md` |
| GitHub Actions job Postgres 17 | CONFIGURATO | `.github/workflows/ci.yml`, job `postgres-rls`; esito push non disponibile tramite strumento collegato |
| Vercel Production dopo modifiche M1 | READY | commit `f211f4ff`, deployment `dpl_Cay3SHnrCpUVz8uHxiW8DNYc8Zcs` |
| Logout e controllo email verificata | CODIFICATI; BUILD PASS | `src/app/console/actions.ts`, `src/app/accedi/actions.ts` |
| Capability OWNER/EDITOR/VIEWER e test unitari | CODIFICATI; BUILD PASS | `src/lib/authz/family-capabilities.ts`, test Vitest |
| Auth reale, API con JWT firmato da Supabase | NON ESEGUITO | Nessun account reale creato |
| SQL live, seed/dummy, pagamenti | NON APPLICATI | Supabase `ojzkikhtcrqcpsvhepbp` senza tabelle applicative all'ultimo controllo |

**Non attribuire a Vercel READY un superamento dei test SQL:** sono due verifiche separate. M1 non è completa operativamente finché il DB RLS non è verificato nel contesto Supabase reale e i workflow di provisioning non sono implementati.

## WF01 — Nuova verifica candidata

- Aggiunta migrazione M1-1 per documenti B2B versionati, P.IVA unica, audit accettazione e RPC atomica.
- Aggiunti test SQL: documenti mancanti, email verificata/non verificata, idempotenza, conflitto P.IVA, grant anonimi.
- I test sono collegati a GitHub Actions nel job Postgres 17 temporaneo; **esito ancora da confermare**. Nessuna scrittura sul database live.

## Sicurezza Supabase (eseguito davvero)

- Security advisors prima: 2 WARN per `public.rls_auto_enable()` `SECURITY DEFINER` eseguibile da `anon` e `authenticated`.
- Migrazione Supabase realmente applicata: `20261020215132_lock_down_rls_event_trigger_execute` (solo REVOKE EXECUTE, nessuna tabella business).
- Security advisors dopo: **0 lints**. Questa verifica non certifica le policy RLS delle migrazioni M1 non ancora applicate.
- Il test di `M1_onboarding.sql` e tutti i workflow Auth/PostgREST reali sono ancora **da confermare**: build Vercel READY non equivale a test SQL.
