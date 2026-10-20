# M2 — Stato verifiche

Aggiornamento 20 ottobre 2026.

| Ambito | Stato | Evidenza |
|---|---|---|
| Listino B2B Standard/Premium e Pro | Codificato | `src/lib/business/pricing.ts`, `pricing.test.ts` |
| Aritmetica IVA inclusa/esclusa con parametri espliciti | Codificata | `src/lib/business/tax.ts`, `tax.test.ts` |
| Arrotondamenti su €5,90 / €9,90 / €39,90 al 22% (esempio) | Test unitari codificati | `tax.test.ts` |
| Scelta ufficiale dell'imponibile/IVA inclusa | NON DEFINITA | `02_APERTI.md` punto 9 |
| Gateway, fatturazione elettronica, reverse charge | NON ATTIVI | Non applicare aritmetica a transazioni |
| Migrazioni M2 o account reali | NON APPLICATE | Supabase live invariato |
| GitHub Actions test dopo commit del calcolatore | DA VERIFICARE | Esito CI non deducibile dalla build Vercel |

**ATTENZIONE:** la matematica calcola un importo soltanto con aliquota e base **fornite**; non rappresenta un motore fiscale autorizzato per il commercio B2B.
