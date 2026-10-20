# M1 — Verifiche e stato

**Aggiornamento 20/10/2026.** Ogni caso distingue codice, database e collaudo.

| Ambito | Evidenza | Stato |
|---|---|---|
| Audit di ruoli e policy rispetto alle fonti ufficiali | `docs/milestones/M1/IMPLEMENTATION.md` | COMPLETATO |
| PostgreSQL 17 disposable | Job `postgres-rls` in `.github/workflows/ci.yml` | CODIFICATO |
| Catalogo RLS e grants | `supabase/tests/M1_readonly_security_assertions.sql` | CODIFICATO; esito CI da raccogliere |
| Simulazione 2 agenzie, 2 memoriali, famiglie e ruoli staff | `supabase/tests/M1_cross_tenant.sql` | CODIFICATO; esito CI da raccogliere |
| Menu famigliari: OWNER/EDITOR/VIEWER e capability | `src/lib/authz/family-capabilities.ts` + test Vitest | CODIFICATO; esito CI da raccogliere |
| Sign-in con email verificata e logout | `src/app/accedi/actions.ts`, `src/app/console/actions.ts` | CODIFICATO; runtime Auth non verificato |
| Live Supabase Auth/RLS | Nessun utente reale/test creato | NON VERIFICATO |
| Migrazione database Supabase operativo | Nessuna scrittura o DDL applicati | NON ESEGUITO |
| Stripe, pagamenti, dummy | Nessuna attività | NON ESEGUITO |

**Nota:** La compilazione Vercel non equivale a un test PostgreSQL, e il job PostgreSQL sintetico non equivale a sessioni Supabase Auth reali. Finché i test reali non sono possibili, i controlli continuano a negare l'accesso in assenza delle membership.
