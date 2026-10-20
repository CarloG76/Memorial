# M0 — Problemi aperti

1. Generare e committare `pnpm-lock.yaml` coerente con il manifest; successivamente impostare `pnpm install --frozen-lockfile` e ripristinare cache.
2. Verificare tutti gli step GitHub Actions dopo il fix al job `setup-node`, correggendo eventuali errori.
3. Eseguire Playwright desktop/mobile e smoke runtime Preview con accesso Vercel autorizzato.
4. Verificare flusso Auth con utente test non privilegiato, senza credenziali nella chat.
5. Allineare la documentazione a eventuali differenze rilevate in CI.

Non chiudere M0 per il solo successo della build Vercel.
