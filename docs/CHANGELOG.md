# Memorial — Changelog tecnico

## 2026-10-21 — Dashboard M1 su main
- Implementate viste con dati reali sotto RLS: agenzia (anagrafica, piano, stato, conteggio memoriali), famiglia (membership e ruoli), staff (conteggi solo Owner/Admin).
- Deploy Production READY su commit `895aecec`. Senza utenti Auth, i flussi autenticati non sono stati ancora verificati dal browser.

## 2026-10-21 — M1 database verificato e hardening RPC
- Tre migrazioni M1 applicate in Supabase Memorial: `20261020220618`, `20261020220643`, `20261020220855` (timestamp UTC 20/10).
- Nove tabelle con RLS attiva; nessun SELECT anon o INSERT/UPDATE diretto authenticated.
- Funzione privilegiata spostata in schema `app_private` e wrapper pubblico `SECURITY INVOKER`; zero warning nel security advisor, due INFO intenzionali.
- Allineati nomi dei file SQL GitHub alla tabella di migrazioni reale.
- Registrazione ancora chiusa in assenza di documenti B2B; nessun account creato.

## 2026-10-20 — Hardening Supabase preesistente
- Revocato EXECUTE a PUBLIC/anon/authenticated sulla funzione `public.rls_auto_enable()` con migrazione applicata `20261020215132_lock_down_rls_event_trigger_execute`.
- Ricontrollato il progetto Supabase: avvisi security advisor da 2 a 0.
- Nessuna migrazione M1 applicata e nessun utente creato.

## 2026-10-20 — WF01 registrazione Free (codice candidato)
- Procedura transazionale dopo email verificata: agenzia Free, Owner, documenti B2B versionati, audit accettazione e P.IVA univoca.
- Inserita UI /console/onboarding e collegamento dalla dashboard senza ruoli.
- Aggiornata CI PostgreSQL effimera con test SQL dell'onboarding, inclusi abusi e duplicati.
- Funzionalità ancora non attiva: documenti legali non pubblicati, schema non migrato in Supabase, zero account Auth.

## 2026-10-20 — M1 registrazione e accessi (parziale, disattivata)
- Aggiunte pagina `/registrati`, schermata esito, callback `/auth/confirm`, collegamento dal login.
- Validazione P.IVA italiana con checksum, email e ragione sociale, test unitari e Playwright.
- Nessun accesso clienti automatico: provisioning agenzia, condizioni B2B e piano Free richiedono completamento WF01.
- Gate server-side `AGENCY_SIGNUP_ENABLED=false` fino a pubblicazione informativa/approvazione; nessun dato raccolto nell'attuale configurazione.
- Documentazione `docs/milestones/M1/REGISTRATION_ACCESS.md` per login, SuperAdmin e verifiche.
- Nessun ruolo privilegiato assegnato, nessuna migrazione live e nessun account creato.

## 2026-10-20 — M1 / M2
- M1: identity/tenancy, RLS candidati, test PostgreSQL sintetici, capability e logout.
- M2: prezzi B2B puri, niente ordini o pagamenti.
- Workflow main-first per requisiti canonici, `feature/*` per ogni extra.

## 2026-10-20 — M0
- Next.js App Router, TypeScript, Supabase SSR, CI, UI navy/avorio/oro; PR storiche incorporate su main.
