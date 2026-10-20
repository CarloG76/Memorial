# M2 — Verifica

- Test di catalogo unitari: `src/lib/business/pricing.test.ts` **CODIFICATI**, esito GitHub Actions da leggere dopo il push su main.
- Pricing compatibile con gli importi ufficiali 01/04: verificati in revisione documentale, non come fatture reali.
- Test pagamento, ledger concorrente, provider webhook: **NON ESEGUITI** e fuori dal perimetro di questa prima tranche.
- Migrazioni M2: **NON APPLICATE**; catalogo SQL ancora da disegnare.
- Nessun importo, checkout o prezzo pubblicato in un endpoint pubblico.
