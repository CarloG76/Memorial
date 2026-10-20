# M2 — Registro verifiche

**Data:** 20 ottobre 2026.

| Area | Esito | Evidenza |
|---|---|---|
| Prezzi rispetto a 01_DECISIONI/04_BUSINESS | CONFRONTATI | €5,90/9,90 Free, €3,90/5,90 Pro, €39,90/mese, €379/anno, durate 1/3/5/10, €10 riattivazione |
| Funzioni pure e test catalogo | CODIFICATI | `src/lib/business/pricing.ts`, `pricing.test.ts` |
| Deploy Vercel `main` | **READY** | commit `6dd22c51`, deployment `dpl_5uiKmdVAGCX7Nz9tXugi7VJ4v7gD`, Production |
| GitHub Actions test dopo commit M2 | NON CONFERMATO | Il connettore GitHub espone qui solo run legate a PR; nessun esito delle run su push main dichiarato |
| Test Stripe/ledger/race | NON ESEGUITI | Non previsti in questa tranche di preventivazione |
| API checkout e dati reali | NON IMPLEMENTATI | Nessun endpoint di pagamento esposto |
| Migrazioni M2 | NON APPLICATE | Solo calcolo in memoria |

**Interpretazione:** la compilazione Vercel READY conferma la build, non prova i test unitari in GitHub Actions né le autorizzazioni su PostgreSQL. Le nuove funzioni restano preventivi in centesimi, non transazioni autorizzate.
