# M0 — Evidenze di verifica

**Aggiornamento:** 20 ottobre 2026. Fonte diretta: GitHub Actions, GitHub, Supabase e Vercel.

| Area | Prova riproducibile | Risultato |
|---|---|---|
| GitHub | Codice M0 presente sul branch `m0-bootstrap` e [PR #1](https://github.com/CarloG76/Memorial/pull/1) | VERIFICATO |
| Supabase | Progetto `ojzkikhtcrqcpsvhepbp` attivo; schema public senza tabelle, zero migrazioni | VERIFICATO |
| Dipendenze | `pnpm-lock.yaml` completo, installazione `pnpm install --frozen-lockfile` | VERIFICATO |
| GitHub Actions | Run [39465265519](https://github.com/CarloG76/Memorial/actions/runs/39465265519), commit `f94e7eac`, conclusione **success** | VERIFICATO |
| Lint, Typecheck, Vitest, Next build, Playwright | Passaggi inclusi nella run e privi di errori | VERIFICATO |
| Vercel Preview | `dpl_EEVUjrWGKaHcxMZyAYfqYZTFUpWB`, `READY` sul commit `f94e7eac` | VERIFICATO |
| Preview protetta via connettore | Richiesta browser Vercel respinta 403 sulla risorsa SSO/alias | NON VERIFICABILE CON PERMESSI CORRENTI |
| Auth con utente reale verificato | Test non eseguito | DA FARE IN M1 CON DATI TEST |
| DDL, dummy, pagamenti | Nessuna scrittura applicativa eseguita sul DB | VERIFICATO |

## Incidenti risolti
1. Framework Vercel inizialmente statico: configurato Next.js.
2. Operazione Git tree senza base che rimuoveva file precedenti: ripristino integrale e correzione.
3. GitHub Actions `setup-node` falliva per lockfile assente: lockfile generato da GitHub runner.
4. Primo trasferimento del lockfile incompleto (mancava ultimo chunk base64): trasferimento corretto e verifica con `--frozen-lockfile` riuscita.

## Conclusione tecnica
M0 **implementata e verificata in CI**, ma PR ancora in bozza e non rilasciata in produzione. I test Auth reali non sostituiscono i test E2E anonimi; verranno eseguiti con staging M1. Nessuna dichiarazione di RLS testate.
