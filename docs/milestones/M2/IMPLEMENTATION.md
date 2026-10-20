# M2 — Implementazione corrente

`src/lib/business/pricing.ts` espone tre funzioni pure per prezzi approvati:
- `previewInitialOrder`: base Free/Pro Standard/Premium e costo della durata TOTALE a partire dalla prima pubblicazione.
- `previewExpiredReactivation`: €10 più durata 3/5/10. Rifiuta durata 1 anno non approvata.
- `subscriptionPriceCents`: Free €0; Pro €39,90/mese e €379/anno.

I valori sono interi in centesimi EUR. `useProCredit` riduce €3,90 solo come **simulazione** e richiede un ledger atomico per determinare se il credito è effettivamente disponibile. Il preventivo non attiva alcun skeleton, non autorizza un prezzo client-side e non crea ordini.

Il catalogo persistente, i prezzi versionati, l'idempotenza ordini e il gateway pagamento richiedono successivi test e migrazioni. Il codice non esegue nulla su Supabase.
