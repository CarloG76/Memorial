# M2 — Catalogo e preventivazione iniziale

## Ambito ufficiale
Listino B2B Free/Pro, Standard/Premium, conservazione totale 1/3/5/10 anni, sconto unitario dei crediti Pro, costo di riattivazione già approvato. I valori vengono da `01_DECISIONI.md` e `04_BUSINESS.md`, non da mockup o ipotesi.

## Stato
**Implementazione iniziale SU `main`: SOLO CALCOLO DI ANTEPRIMA.** Nessuna API checkout, nessun incasso, nessun ordine persistito e nessuna concessione di credito.

- `src/lib/business/pricing.ts` — calcolo in centesimi, ritorna righe e importo preventivo.
- `src/lib/business/pricing.test.ts` — test Free/Pro, Standard/Premium, 3/5/10, crediti, riattivazione e casi vietati.

## Criteri per M2 completo
DB SQL versionato per listino storico, prezzi snapshot B2B, ordine in stato draft, scope agency e idempotenza; convalida RLS su PostgreSQL e test con identità Supabase. Il pagamento vero rimane fuori da questa unità e il modulo Stripe verrà sviluppato in branch dedicato come richiesto.

Non introdurre calcoli per proratazione, upgrade conservazione esistente, nuova durata 1 anno dopo riattivazione, applicazione automatica del credito o calcolo IVA, perché sono aspetti aperti.
