# MEMORIAL — Ambienti e deployment

## Progetto Vercel
- Progetto: `memorial`.
- Branch principale GitHub: `CarloG76/Memorial:main`.
- Target principale: Vercel **Production** da push `main`.
- Preview: branch isolati `feature/*` e `fix/*` collegati automaticamente tramite GitHub integration.
- Framework: Next.js, Node 24. Evitare deployment manuali che scavalchino il branch approvato.
- SSO Vercel: le anteprime sono protette in base alla configurazione della piattaforma; il connettore ha già riscontrato HTTP 403 nel fetch diretto delle Preview, indipendentemente da build READY.

## Variabili d'ambiente
Client Supabase SSR: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (pubblicabili per definizione). Vanno impostate nel pannello Vercel per gli ambienti appropriati senza inserirne i valori nei documenti Git.
Valori segreti (provider pagamenti, service role, posta): **solo server**, per ambiente, mai `NEXT_PUBLIC_`. Non attivare pagamenti live senza specifica approvazione.

## Pipeline e release
`main` esegue lint, typecheck, Vitest, Next build e Playwright in GitHub Actions; il push avvia anche Vercel automaticamente. Le due pipeline possono correre in parallelo: READY non significa che CI sia stata superata. Se una modifica rompe il sito, preparare un revert puntuale e verificare la successiva produzione; evitare reset di Supabase.

## Livelli di verifica
1. `CODED`: codice presente su GitHub.
2. `CI_PASS`: build e test automatici superati.
3. `DEPLOYED`: deployment Vercel READY sullo SHA atteso.
4. `RUNTIME_VERIFIED`: controllo HTTP reale e con account/test, se autorizzato.
5. `ACTIVE`: feature abilitata e, se necessarie, autorizzazioni e servizi live attivati.

I database non seguono automaticamente il push: SQL e RLS versionati richiedono processo separato, staging e verifica preventiva.

## M1: avvertenza
La migrazione `20261020190000_m1_identity_tenancy.sql` è **candidata**, non è stata applicata al database operativo alla data 20/10/2026. Fino a che non si concludono test RLS/tenancy le console restano prive di dati. Il deployment del codice M1 su main non implica attivazione dell'accesso familiare e dei flussi business.
