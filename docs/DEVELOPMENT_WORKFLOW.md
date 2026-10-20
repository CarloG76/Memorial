# MEMORIAL — Workflow di sviluppo

Decisione approvata 20 ottobre 2026.

## `main` è sempre il ramo delle funzionalità già ufficiali
Tutto ciò che si trova nella documentazione approvata `01_DECISIONI.md` e nelle specifiche coerenti viene sviluppato direttamente su `main` per milestone progressive. La documentazione permanente resta in `docs/milestones/M0`, `M1`, `M2` ecc. Ogni push avvia controlli CI e deployment Vercel principale. Nessun dato non autorizzato e nessun pagamento reale vengono attivati solo per effetto del push. SQL e RLS richiedono test e gate separato.

## Ogni nuova richiesta extra → branch dedicato
**Si applica a QUALSIASI nuova funzionalità o modifica non contenuta nella documentazione canonica, non soltanto Stripe.** Nuove sezioni, namespace, API, esperimenti UI, notifiche extra, integrazioni provider, modifiche alle regole e qualunque variante richiesta successivamente vengono create su `feature/<nome>` dall'HEAD di `main`.

Ogni feature contiene `docs/features/<nome>/SPEC.md` (delta rispetto ai requisiti, nessuna decisione business inventata), `IMPLEMENTATION.md`, `TESTS.md`, `ROLLBACK.md`. Si sviluppa e si testa nella Preview protetta; si prova con i ruoli e gli scenari di sicurezza appropriati; quindi si propone merge su `main`. Se comporta prezzi, privacy, cancellazioni, pagamenti reali o esposizione pubblica, il merge non sostituisce l'eventuale approvazione specifica.

**Stripe era solo un esempio.** Quando arriverà la richiesta, verrà usato `feature/stripe-payments` con chiavi test e webhook verificati prima del merge; il live rimane disabilitato fino ad autorizzazione. Lo stesso vale, senza eccezioni, per ogni nuova funzione.

## Stato verificato
- M0 e M1 integrati su `main`, PR storiche #1 e #2.
- M1 SQL candidata non applicata su Supabase operativo.
- Test SQL tenant in CI GitHub su PostgreSQL 17 isolato; nessuna creazione di Supabase staging a pagamento in questa fase.
- I deployment Vercel protetti da SSO possono richiedere autorizzazione per test browser remoto.

## Registro richiesto
Per ogni sviluppo annotare richiesta, fonte, codice, commit, CI, Vercel, database, test eseguiti, difetti, rollback e prossime azioni. Non dichiarare **testata** una modifica che è soltanto implementata o compilata. I problemi business irrisolti rimangono in `02_APERTI.md`.
