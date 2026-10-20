# M0 — Registro operativo (20 ottobre 2026)

## Audit iniziale (sola lettura)
- GitHub: repository pubblico `CarloG76/Memorial`, branch base `main`, solo README all'avvio, nessun package.json.
- Supabase: `ojzkikhtcrqcpsvhepbp`, account Goch, PostgreSQL 17, eu-west-1, stato ACTIVE_HEALTHY. Schema `public`: zero tabelle applicative; zero migrazioni.
- Vercel: progetto esistente `memorial` (`prj_sZrA0KmmhF59wk7cDolVbCeCncwz`), deployment precedente READY, SSO protection segnalata; non assume che il repository sia collegato a un workflow preview.
- Fonti: decisioni canoniche prevalenti; SQL baseline e RLS preliminari non production-ready. Nessun DDL o seed eseguito.

## Cosa implementa M0
- Next.js App Router / React / TypeScript; design system crema/navy/oro, responsive; shell menu canonici 7/5/7.
- Autenticazione Supabase SSR con browser client, server client, Next.js proxy per refresh, callback PKCE e getClaims server-side.
- Fail-closed senza configurazione Supabase; nessun privilegio derivato dai cookie o dagli URL; nessun dato memoriale.
- Infrastruttura di qualità: ESLint, TypeScript strict, Vitest, Playwright, workflow GitHub Actions, health endpoint.
- Supabase migrations directory vuota per M1; `robots.txt` con disallow totale.
- Nessuna credenziale, email, ordine, dato dummy o migrazione attivata.

## Non disponibile / non verificato in M0
- Membership RBAC, RLS, schemi, dashboard con dati, pagamenti, storage privato, pubblicazione, workflow, email.
- Test RLS e migrazione dry-run: non applicabili senza migrazioni; pianificati M1 su DB isolato.
- Auth reale richiede impostazioni Supabase pubblicabili e account con email verificata.
- L'integrazione Git-Vercel e preview vanno verificate; nessuna esposizione pubblica/produzione autorizzata.

## Precedenza delle decisioni
`01_DECISIONI.md` prevale su mockup e altri documenti. I blocchi business sono registrati in `02_APERTI.md`.

## Prossimo intervento
M1: schema su staging, ruoli/profili/tenant, inviti, autorizzazioni lato server, test cross-tenant RLS. Nessuna esecuzione automatica degli SQL preliminari.
