# M1 — Verifiche

Aggiornamento 20 ottobre 2026.

| Verifica | Evidenza | Stato |
|---|---|---|
| GitHub Actions M1 | [Run 39465277618](https://github.com/CarloG76/Memorial/actions/runs/39465277618), commit `fceea726` | SUCCESS |
| `pnpm install --frozen-lockfile` | Stesso lockfile di M0, run CI | SUCCESS |
| TypeScript, lint, Vitest, Next build, Playwright desktop/mobile | Run CI M1 | SUCCESS |
| Vercel Preview M1 | `dpl_DkqmJchWnZ1ZRpFfhdqwQnXVthaX` | READY |
| Isolamento anon / API /me | Codificato in `e2e/m1-authz.spec.ts` | ESEGUITO IN CI (non autenticato) |
| Test ruoli con account Auth verificati | Richiedono staging e utenti autorizzati | NON ESEGUITO |
| Asserzioni catalogo RLS | SQL in `supabase/tests` | NON ESEGUITO |
| Test PostgreSQL cross-tenant | Richiede database temporaneo isolato | NON ESEGUITO |
| Migrazione SQL M1 sul DB live | Non applicata | **NESSUNA MODIFICA** |
| Preview protetta visualizzata dal connettore | 403 per autorizzazione Vercel insufficiente | NON VERIFICATA |

**Interpretazione:** CI/build positivi dimostrano correttezza di compilazione e dei test codificati; NON dimostrano RLS, inviti o tenancy con dati reali. M1 resta draft finché tali verifiche non sono completate.
