# M0 — Evidenze di verifica

**Aggiornamento:** 20 ottobre 2026. Fonte diretta: GitHub Actions, GitHub, Supabase e Vercel.

| Area | Evidenza | Stato |
|---|---|---|
| GitHub | [PR #1](https://github.com/CarloG76/Memorial/pull/1) incorporata in `main` con squash commit `8eaad8f9` | MERGED |
| Supabase | Progetto `ojzkikhtcrqcpsvhepbp` attivo, zero tabelle public, zero migrazioni al controllo | VERIFICATO |
| Dipendenze | `pnpm-lock.yaml`, `pnpm install --frozen-lockfile` | VERIFICATO |
| GitHub Actions M0 | [Run 39465704854](https://github.com/CarloG76/Memorial/actions/runs/39465704854), commit `f4f68b50`, `success` | VERIFICATO |
| Test | Lint, typecheck, Vitest, build, Playwright desktop/mobile | PASS |
| Vercel Preview M0 | `dpl_EEVUjrWGKaHcxMZyAYfqYZTFUpWB` | READY |
| Vercel Production M0 | Deployment da `main` dopo PR #1 `dpl_Hd1Nr9bWWLBaGJkPB1aTHmLkF1o7` | READY |
| Runtime interattivo protetto | Connessione browser Vercel a risorsa con SSO restituisce 403 | NON VERIFICATO |
| Auth con utenti reali | Non eseguito | DA COLLAUDARE CON M1 |
| SQL e dummy | Nessuna migrazione o fixture applicata | VERIFICATO |

## Incidenti risolti
- Configurazione Vercel statica → Next.js.
- Albero Git perso in un commit intermedio → ripristino integrale.
- Cache pnpm senza lockfile → lockfile generato.
- Chunk base64 mancante nel primo lockfile → lockfile completo verificato con frozen install.

## Conclusione
M0 è **integrata in main, CI superata e distribuita in Vercel Production**. Le console reali e la gestione dati non fanno parte di M0 e non risultano testate. Il deploy non è sinonimo di accesso pubblico: permane la protezione SSO Vercel configurata.
