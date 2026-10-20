# M2 — Questioni aperte

1. Applicazione IVA a prezzi B2B e fatturazione elettronica: `02_APERTI.md` punto 9. **Calcolo puramente matematico implementato**, ma scelta imponibile/IVA inclusa, aliquota per transazione, territorialità e documento fiscale non approvati. `docs/milestones/M2/VAT_DESIGN.md`.
2. Versione listino e snapshot immutabile a DB prima dei pagamenti; il preventivo client non autorizza l'incasso.
3. Test con veri account agenzia, RLS M1 in ambiente autentico, rate limit e audit.
4. Idempotenza ordine, transazione per crediti Pro e trattamento zero-euro: da progettare e verificare.
5. Non implementare proratazione o upgrade conservazione e riattivazione di durata annuale non prezzata.
6. Provider pagamenti: branch isolato `feature/stripe-payments`, test mode, non attivare live senza decisione esplicita.
