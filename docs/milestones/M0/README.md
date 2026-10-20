# M0 — Bootstrap applicativo

**Obiettivo:** fondazione Next.js/TypeScript, design Memorial, Supabase Auth SSR e controlli automatici.

**Stato codice: INTEGRATO SU `main`.** PR storica [#1](https://github.com/CarloG76/Memorial/pull/1) incorporata tramite squash commit `8eaad8f9` il 20 ottobre 2026.

**Verificato prima dell'integrazione:** GitHub Actions [39465704854](https://github.com/CarloG76/Memorial/actions/runs/39465704854) `success` sul commit `f4f68b50`; pnpm frozen, lint, typecheck, Vitest, Next build, Playwright desktop/mobile. Vercel Preview READY; Vercel Production su `main` READY dopo PR #1.

**Limiti:** sessioni reali con utenti test e fetch diretto della Preview protetta dal connettore non verificati. Nessuna migrazione, seed, pagamento reale eseguito da M0.
