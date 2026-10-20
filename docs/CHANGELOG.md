# Memorial — Changelog tecnico

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
