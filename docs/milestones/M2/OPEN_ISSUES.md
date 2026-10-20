# M2 — Problemi e attività aperte

1. Prima di usare importi come base di incasso, versione del listino e price snapshot firmato/immutabile a DB.
2. Account agenzia verificato, RLS M1 in ambiente reale, rate limit e audit delle richieste ordine.
3. Definire e collaudare idempotenza, transazione credito e gestione fallimento zero-Euro senza inventare conferme di pagamento.
4. Non implementare upgrade/proratazione, durata di riattivazione 1 anno o IVA fino alle decisioni in `02_APERTI.md`.
5. Gateway Stripe/provider pagamenti: sviluppare su `feature/stripe-payments` con soli pagamenti di test e merge dopo test.
