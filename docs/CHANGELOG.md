# Memorial — Changelog tecnico

## 2026-10-20 — Workflow main-first (decisione di sviluppo)
- `main` diventa il ramo canonico dello sviluppo ordinario basato sulle specifiche ufficiali e del deployment principale.
- Richieste aggiuntive, namespace, sperimentazioni e integrazioni isolate (esempio Stripe) usano `feature/*` con Preview, test e merge verso `main`.
- Aggiunti `docs/DEVELOPMENT_WORKFLOW.md`, `docs/DEPLOYMENTS.md`, `docs/features/`. Rimane il registro `docs/milestones/Mx/`.

## 2026-10-20 — M1 (codice integrato, database invariato)
- PR #2 incorporata in `main`, commit `afc3acc7`. GitHub Actions pre-merge verdi e Preview READY.
- Modellati profili, platform/agency/family membership, inviti e memoriale minimo.
- Schema SQL versionato **non eseguito**, RLS pronte per test su DB isolato, guard SSR fail-closed.
- Test reali cross-tenant e migrazione live non eseguiti.

## 2026-10-20 — M0 (integrata)
- PR #1 incorporata in `main`, commit `8eaad8f9`, Vercel Production READY.
- Next.js / React / TypeScript, design system navy/avorio/oro, UI responsive e shell ruoli.
- Client Supabase SSR, guard senza dati, GitHub CI, Next build, Playwright, health.
- Lockfile pnpm versionato, installazione frozen e CI verde.
- Nessun dato demo o migrazione applicata.
