# Memorial

Piattaforma commemorativa B2B per agenzie, famiglie e visitatori. Stack Next.js 16, TypeScript, React, PostgreSQL, Supabase Auth/Storage, Vercel.

## Sviluppo e ambienti

**`main` è il ramo canonico di sviluppo delle funzionalità previste dalla documentazione ufficiale e alimenta il deployment Vercel principale.** Le richieste aggiuntive, i nuovi namespace sperimentali e le integrazioni volutamente isolate (es. Stripe) vanno su `feature/*`, con Preview e test prima del merge.

Procedure: [Workflow di sviluppo](docs/DEVELOPMENT_WORKFLOW.md), [Deployment](docs/DEPLOYMENTS.md), [Milestone](docs/milestones/README.md), [Feature isolate](docs/features/README.md), [Changelog](docs/CHANGELOG.md).

## Avvio locale

Prerequisiti: Node.js 24, pnpm 10, progetto Supabase test con URL e publishable key. Copiare `.env.example` in `.env.local` senza inserire credenziali private nel repository.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

`pnpm test:e2e` richiede Chromium (`pnpm exec playwright install chromium`). La route `/api/health` risponde con un payload pubblico minimo.

## Stato operativo

- M0: applicazione, design system, Auth SSR, CI ed endpoint health integrati in `main`.
- M1: modelli identity/tenancy e guard membership integrati nel codice, ma **migrazione SQL candidata non applicata**; RLS non ancora collaudate su database reale. In assenza di schema il sistema nega l'accesso ai dati e alle console.
- Nessuna funzione di pagamento live, contenuti familiari, demo permanente o pubblicazione di memoriali ancora attiva.
- Il repository è pubblico: non inserirvi chiavi server-side, segreti o dati personali.
- Le decisioni ufficiali in `01_DECISIONI.md` delle fonti di progetto prevalgono sulle specifiche subordinate e sull'SQL preliminare; le questioni aperte restano in `02_APERTI.md`.

Non assimilare build Vercel READY alla verifica di sicurezza o completezza funzionale.
