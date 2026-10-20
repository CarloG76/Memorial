# M1 — Registro prove

20/10/2026, in corso.

| Attività | Stato | Evidenza |
|---|---|---|
| Audit della corrispondenza SQL ai requisiti | ESEGUITO | `docs/milestones/M1/IMPLEMENTATION.md` |
| Preparazione RLS PostgreSQL 17 in CI | CODIFICATO | `.github/workflows/ci.yml` job `postgres-rls` |
| Preparazione account/tenant sintetici | CODIFICATO | `supabase/tests/M1_auth_harness.sql`, `M1_cross_tenant.sql` |
| SQL e test RLS in CI | **DA VERIFICARE** | Leggere l'esito GitHub Actions del commit |
| Test API con token Supabase Auth reali | NON ESEGUITO | Richiede ambiente di test autorizzato |
| Creazione/modifica utenti reali | NON ESEGUITO | Nessun account creato |
| Applicazione migrazione su Supabase `ojzkikhtcrqcpsvhepbp` | NON ESEGUITO | DB live invariato |
| Pagamenti, email, dummy e storage | NON ESEGUITO | Nessun effetto esterno |

I test CI con PostgreSQL servono a verificare SQL/RLS effettive e la riservatezza fra tenant: non provano la correttezza di un token JWT autentico emesso da Supabase, né risolvono la governance business.
