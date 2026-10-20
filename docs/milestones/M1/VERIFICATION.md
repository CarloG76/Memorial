# M1 — Verifiche

**Aggiornamento:** 20 ottobre 2026. Si distingue codice distribuito da schema dati realmente testato.

| Verifica | Evidenza | Stato |
|---|---|---|
| PR di integrazione | [PR #2](https://github.com/CarloG76/Memorial/pull/2), squash commit `afc3acc7` su `main` | MERGED |
| GitHub Actions M1 | [Run 39475813862](https://github.com/CarloG76/Memorial/actions/runs/39475813862), commit pre-merge `a26f1da3` | PASS |
| Frozen install, TS, lint, Vitest, Next build, Playwright | Run CI M1 | PASS |
| Preview M1 | `dpl_CrHyWDFCMtizA5hAKfjD9ygQQ9he` | READY |
| Vercel Production con codice M1 | `dpl_FvJEqXXrQRbNibzegYUoNVsMU1ra`, commit `afc3acc7`; successivo deploy documentazione `dpl_6C1DW35pCFA6mXaHF7TgnztzKzVL` commit `ca44ca7e` | READY |
| Test anon/API /me | Playwright su build non autenticata | PASS |
| Test con account Auth verificato | Richiede staging e utenti di test | NON ESEGUITO |
| Catalogo RLS in PostgreSQL | SQL test presente, non eseguito | NON ESEGUITO |
| Test di negazione cross-tenant | Necessario database di test isolato | NON ESEGUITO |
| Migrazione candidata live | Database `ojzkikhtcrqcpsvhepbp` invariato | NON APPLICATA |
| Browser diretto Vercel dietro SSO | Permessi connettore insufficienti (403) | NON VERIFICATO |

**Stato:** M1 ha codice integrato e compilato, ma non è completa operativamente: RLS, invitati, account reali e test PostgreSQL devono essere convalidati prima di abilitare dati e workflow.
