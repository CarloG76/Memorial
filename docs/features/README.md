# MEMORIAL — Funzionalità aggiuntive / branch isolati

Le richieste fuori dalle specifiche e le integrazioni volutamente separate vengono tracciate qui, una directory per richiesta. Ogni cartella nasce con il branch `feature/<slug>` da `main`. I requisiti che sono già definiti nella documentazione ufficiale non vengono reinventati.

## Stato
`PROPOSTA` → `IN_SVILUPPO` → `CI_PASS` → `TESTATA_IN_PREVIEW` → `MERGED_MAIN` → `DEPLOYED_MAIN` → `ATTIVATA`.

Il passaggio a `ATTIVATA` può richiedere un'approvazione separata: in particolare pagamenti live, donazioni, dati reali, esposizione pubblica e operazioni distruttive.

## Nuova feature
Duplicare il modello `FEATURE_TEMPLATE.md` nella directory `docs/features/<slug>/SPEC.md`; aggiungere `IMPLEMENTATION.md`, `TESTS.md`, `ROLLBACK.md` man mano che la modifica evolve.

Esempio: `feature/stripe-payments` con checkout, webhook e ledger in *test mode*; non implica attivazione live.
