# M1 — Identity & Tenancy

**Branch:** `m1-identity-tenancy` da `m0-bootstrap`; [PR #2](https://github.com/CarloG76/Memorial/pull/2) draft (stacked).
**Ambito:** ruoli e appartenenze, migrazione candidata con RLS fail-closed, console protette, endpoint `/api/v1/me`.
**Stato:** CODICE/CI VERIFICATI, DATABASE **NON** MIGRATO / RLS **NON** TESTATE SU POSTGRES.

La migrazione contiene profili, ruoli piattaforma, anagrafiche agenzie e membership, memoriale minimo FK, appartenenze famiglia e inviti hash. Nessun prezzo, dato reale, pagamento o donazione.

Le verifiche obbligatorie prima di promozione includono due tenant di prova, due famiglie, assenza di escalation e test di lettura/scrittura con ogni ruolo in PostgreSQL isolato. Senza test di staging e revisione privacy non incorporare la PR M1.
