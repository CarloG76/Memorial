# M0 — Problemi e dipendenze

1. Verificare GitHub Actions anche con `pnpm install --frozen-lockfile` e cache pnpm usando il lockfile versionato.
2. Test runtime Preview dietro Vercel SSO da account autorizzato.
3. Test login con utente Auth verificato e membership reale demandato a M1 dopo test migratorio su staging.
4. Garantire PR review e controllo umano prima di un merge su `main`.

**Risolti:** deployment statico erroneo (Vercel framework Next.js), perdita accidentale dell'albero Git nei commit (ripristino completo), errore cache per lockfile mancante (lockfile generato e versionato).
