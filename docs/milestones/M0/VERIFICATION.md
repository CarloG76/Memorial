# M0 — Evidenze di verifica

Aggiornamento 20 ottobre 2026 (verifiche effettuate tramite GitHub, Supabase, Vercel).

| Oggetto | Evidenza | Stato |
|---|---|---|
| Repository | `CarloG76/Memorial`, main iniziale solo README | VERIFICATO |
| Supabase | Progetto attivo, schema public senza tabelle, zero migrazioni | VERIFICATO |
| Vercel build da commit `24c0441` | `dpl_6kzPxMcaFgzRR1Y6gepan13Q4cJ2` READY, Next.js | VERIFICATO |
| GitHub Actions M0 | Run [39464155669](https://github.com/CarloG76/Memorial/actions/runs/39464155669): lint, typecheck, Vitest, Next build, Playwright completati con successo | VERIFICATO |
| Blocco CI originario | Setup Node mancava lockfile per cache pnpm: recuperato e corretto | RISOLTO |
| Lockfile risolto in runner | `pnpm-lock.yaml` generato da `pnpm install` in runner; blob Git creato dai byte esatti dei logs | GENERATO |
| CI con lockfile versionato e frozen install | Deve essere eseguita dopo commit definitivo | NON ANCORA VERIFICATO |
| Auth reale con utente test | Login+membership reali non esercitati | NON VERIFICATO |
| DDL/dummy/payment | Nessuna scrittura Supabase applicativa eseguita | VERIFICATO |

La build READY non dimostra sicurezza delle policy RLS o autorizzazioni fra tenant. La M0 termina sul codice applicativo e sulle smoke assertions non autenticate; il collaudo Auth+RLS è di M1.
