# M2 — IVA (solo aritmetica, trattamento fiscale da approvare)

20 ottobre 2026. In `02_APERTI.md` punto 9 è esplicitamente aperto il trattamento dell'IVA e della fatturazione italiana; `04_BUSINESS.md` precisa che il listino è espresso in euro ma non è stabilito se imponibile o IVA inclusa.

## Implementato
`src/lib/business/tax.ts` è un calcolatore matematico in centesimi. Non dispone di aliquota predefinita, paese predefinito o base prezzo predefinita. Necessita:
1. prezzo di listino finale dopo gli sconti validati;
2. `rateBasisPoints` fornito da logica fiscale autorevole (es. 2200 = 22%);
3. `basis`: `EXCLUDING_VAT` o `INCLUDING_VAT`.

Restituisce netto, IVA e lordo. Non determina la territorialità, il debitore d'imposta, reverse charge, esenzioni, non imponibilità, tipologia di operazione, split payment, fatturazione elettronica né il momento d'esigibilità.

Esempio *puramente dimostrativo* per operazione italiana con IVA ordinaria 22%:
| Listino | Netto se listino IVA esclusa | IVA | Totale | Netto se listino IVA inclusa | IVA inclusa |
|---|---:|---:|---:|---:|---:|
| €5,90 | €5,90 | €1,30 | €7,20 | €4,84 | €1,06 |
| €9,90 | €9,90 | €2,18 | €12,08 | €8,11 | €1,79 |
| €39,90 | €39,90 | €8,78 | €48,68 | €32,70 | €7,20 |

**Questo codice non va collegato a checkout/fatture finché non vengono approvati i parametri fiscali.**

## Verifiche
`src/lib/business/tax.test.ts`: aritmetica netta/lorda, arrotondamenti, €0, sconto del preventivo Pro senza concedere credito, configurazioni mancanti, input negativi/sovradimensionati. Esito CI da verificare dopo il push.

## Decisioni necessarie prima del rilascio economico
- Confermare formalmente listino imponibile vs IVA compresa.
- Determinare trattamento IVA per operazioni B2B italiane e transfrontaliere (incluse condizioni di applicazione reverse charge).
- Provider e requisiti documentali della fattura elettronica, imponibile/IVA e natura operazione.
- Precisare se e quando sono applicabili aliquote diverse da quella ordinaria e arrotondamenti su documento, con commercialista/consulente fiscale.
- Integrazione con snapshot fiscalmente corretti e ledger storico: mai ricalcolare una fattura in base ai parametri correnti.
