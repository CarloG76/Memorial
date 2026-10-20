# Stripe Payments — feature isolata prevista

**Stato:** PROPOSTA / BRANCH NON ANCORA APERTO.
**Branch designato:** `feature/stripe-payments` a partire dall'HEAD attuale di `main` quando inizierà lo sviluppo dell'integrazione.
**Origine:** esempio esplicito della strategia di branching del 20/10/2026; la parte pagamenti compare già nelle milestone ufficiali, ma viene volutamente isolata su branch per test e merge.

## Ambito senza invenzioni business
La parte economica deve utilizzare **esclusivamente** prezzi, crediti, ciclo abbonamento, commissioni e condizioni approvate nei documenti canonici. Nessun importo, regola o provider aggiuntivo viene fissato con questa scheda.

## Test preliminari obbligatori
- Stripe test mode, mai addebito reale da branch o Preview.
- Webhook con firma, replay/idempotenza, errori/out-of-order, riconciliazione importi e ordine.
- Crediti Pro senza doppia assegnazione sotto concorrenza, piano nel periodo corretto, accessi tenant.
- Checkout annullato/fallito non attiva skeleton né inviti.
- Audit, gestione errori e test regressione sulle aree Agenzia/SuperAdmin.
- Migrazioni SQL/RLS testate su staging isolato, nessuna applicazione indiscriminata.

## Gate
Codice su feature → CI → Preview → test funzionali e sicurezza → PR → merge in `main` → verifica deployment. **Abilitare Stripe live è uno step separato che richiede esplicita autorizzazione.**

Quando verrà aperto il branch aggiungere `IMPLEMENTATION.md`, `TESTS.md`, `ROLLBACK.md` e registrare commit, PR e deployment.
