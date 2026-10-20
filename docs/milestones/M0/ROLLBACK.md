# M0 — Rollback

- Per annullare la proposta: chiudere [PR #1](https://github.com/CarloG76/Memorial/pull/1) senza merge; `main` conserva il commit iniziale.
- Se la PR è già incorporata: revert tramite nuova PR del commit di merge, previa verifica dell'eventuale codice sviluppato sopra M0.
- Non sono state eseguite migrazioni, seed, pagamenti o scritture Supabase: **nessun rollback dati M0**.
- Per ripristinare la configurazione Vercel precedente (framework nullo/statico) occorre approvazione esplicita, perché potrebbe interrompere deployment successivi; preferire correzione configurazione.
- I valori non segreti Preview/Development possono essere rimossi da Vercel senza alterare dati PostgreSQL; verificare prima gli ambienti che li utilizzano.
