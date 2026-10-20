# MEMORIAL — Ambienti e deployment

## Progetto Vercel
- Progetto: `memorial`.
- Repository: `CarloG76/Memorial`, branch di produzione: `main`.
- Le modifiche ordinarie da specifiche approvate avvengono su `main` e avviano il deployment Vercel Production.
- Nuove funzionalità/isolate (`feature/*`, ad es. Stripe) hanno Preview protetta, test e merge `main`.
- Framework Next.js, Node 24; non pubblicare segreti in log o nel repository.

## Configurazione ambienti (verificata 20/10/2026)
`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` sono configurate su **Production**, **Preview** e **Development** tramite Vercel. Sono valori pubblicabili; non sono state inserite service role key, chiavi di Stripe live o segreti di terzi.

## Rilascio principale verificato
- PR #1 M0 → commit `8eaad8f9`, Vercel Production READY.
- PR #2 M1 → commit `afc3acc7`, Vercel Production READY.
- Registrazione del workflow main-first → commit `ca44ca7e`, deployment `dpl_6C1DW35pCFA6mXaHF7TgnztzKzVL` Production **READY**. Alias del progetto: `memorial-navy.vercel.app`, `memorial-ai-visions.vercel.app`, `memorial-git-main-ai-visions.vercel.app`.
- Vercel mantiene SSO Protection sulle URL secondo la configurazione corrente. Il connettore non è riuscito a leggere direttamente la pagina protetta (403). Non disattivare tale protezione implicitamente.

## Controlli su ogni sviluppo
1. `CODED`: commit versionato.
2. `CI_PASS`: lint, TS, Vitest, build, Playwright, verificato il run.
3. `DEPLOYED`: Vercel READY sullo SHA atteso.
4. `RUNTIME_VERIFIED`: test HTTP/autenticato se autorizzato.
5. `ACTIVE`: funzionalità abilitata con database, permessi, servizi configurati e approvazioni.

La pipeline GitHub e il deployment Vercel possono avanzare in parallelo; un deployment READY da solo non certifica il test completo. Le migrazioni non sono automatizzate insieme ai push: staging, review RLS e autorizzazione prima dei dati reali.

## Database M1
La migrazione `supabase/migrations/20261020190000_m1_identity_tenancy.sql` è **solo proposta** al 20/10/2026. Nessuna migrazione è stata applicata all'ambiente operativo. La console nega accesso ai dati in assenza di schema e membership. Prima di attivare flussi completi: staging, Auth verificata e test RLS negativi reali.

## Rollback
Revert selettivo di codice con nuovo commit su `main` e verifica del nuovo deployment; per emergenze Vercel valutare rollback di deployment esistente. Nessun DROP/RESET o modifica RLS live senza autorizzazione, backup e verifica impatto. Per feature isolate, fare riferimento al relativo `docs/features/<slug>/ROLLBACK.md`.
