# Memorial

Piattaforma commemorativa B2B: agenzie, famiglie e visitatori. Base applicativa M0 in Next.js 16 / TypeScript / Supabase / Vercel.

## Avvio locale

Prerequisiti: Node.js 24, pnpm 10, progetto Supabase di sviluppo. Copiare `.env.example` in `.env.local` e impostare **esclusivamente** URL e publishable key per testare l'autenticazione. Non inserire mai chiavi segrete nel repository.

```bash
corepack enable
pnpm install --no-frozen-lockfile
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`pnpm test:e2e` richiede Chromium Playwright (`pnpm exec playwright install chromium`). La route `/api/health` offre una diagnostica pubblica senza dettagli di infrastruttura.

## Stato reale

M0 realizza homepage, design system, shell responsive, client Supabase SSR, login/callback, pagine area **inaccessibili senza sessione**, CI e test di avvio. **Non** implementa ancora autorizzazioni di ruolo/tenant, database, pagamenti, contenuti, RLS né accessi ai memoriali. Nessuna pagina console espone dati o esegue operazioni finché M1 non introduce policy RLS e controlli server-side di appartenenza. Nessuna migrazione è stata applicata.

## Documentazione

Le decisioni canoniche nelle fonti del progetto prevalgono sui mockup e sugli SQL preliminari. Importi, ruoli e workflow non vengono ridefiniti in M0. Vedere `docs/M0-REPORT.md`.

## Sicurezza

- Chiavi browser: solo `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Chiavi service-role, Stripe, SMTP e DB: solo negli ambienti server futuri, mai `NEXT_PUBLIC_`.
- Il login **non** determina autorizzazioni; `getClaims()` verifica l'identità e M1 aggiungerà membership e RLS.
- I terminali dell'applicazione rimangono bloccati per tutti finché non sono implementate le autorizzazioni.
- Nessun dato demo, email transazionale o checkout attivo.
