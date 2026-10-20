# M1 — Piano rollback

## Prima di staging
La migrazione è **solo un file versionato**. Il rollback consiste nel revert della PR M1, senza modificare PostgreSQL.

## Dopo staging
1. Fermare temporaneamente i workflow che scrivono su staging; fare backup e snapshot dello schema.
2. Se lo schema è vuoto (nessun utente o dato associato), pianificare un rollback DDL su staging sotto revisione. Eventuali DROP sono distruttivi: mai eseguirli in automatico o in produzione.
3. Se sono presenti righe, non fare DROP CASCADE: ripristinare da backup di staging o procedere con migrazione forward additiva verificata.
4. In caso di bug RLS, bloccare immediatamente endpoint coinvolti; preferire `REVOKE` e policy restrittive come hotfix validato.

## Produzione
Nessuna applicazione di M1 è autorizzata in questa fase. Un eventuale futuro rollback richiede approvazione esplicita, piano dati, test e revisione di tutte le dipendenze.
