# M0 — Problemi aperti / dipendenze

1. Verifica interattiva Preview protetta: il connettore corrente riceve HTTP 403 durante la lettura del bypass Vercel. Serve autorizzazione di accesso al team/progetto se si desidera collaudo remoto tramite connettore.
2. Test autenticazione con account Supabase verificato e membership reale demandato a M1 in staging.
3. Revisione PR #1 e successivo eventuale merge su `main` solo dopo consenso alla pubblicazione in produzione.

**Risolto:** framework errato Vercel, albero Git sovrascritto, lockfile mancante/incompleto, installazione frozen, lint, typecheck, Vitest, build, Playwright.
