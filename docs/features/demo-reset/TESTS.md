# DEMO Reset v1 — verifica eseguita il 15/11/2026

## Stato
- GitHub: codice e migrazione su `main`.
- Supabase Memorial: migrazione `demo_reset_baseline_v1` applicata.
- Baseline privata congelata in `app_private.demo_reset_baseline`, 11 tabelle.
- Vercel: deploy del commit `652058b` READY su Production.
- UI: SuperAdmin > Reset Demo Data, con conferma letterale `RESET DEMO DATA`, preview dei conteggi ed esito.

## Baseline verificata (record)
- Agenzie 3; memoriali 12; operatori agenzia 4; familiari 10.
- Ricordi 2; pensieri 2; foto 6; profilo pubblico 1; impostazioni visual 1; slot 1; inviti 0.

## Test SQL con ROLLBACK (nessun reset persistito)
1. Reset con identità OWNER in transazione: restituiti `success=true` e conteggi corretti.
2. Modificata temporaneamente la biografia M01 e aggiunto pensiero DEMO; reset eseguito nella stessa transazione: biografia ripristinata, pensiero aggiunto rimosso, pensieri tornati a 2.
3. Identità senza OWNER: reset respinto con `42501`.
4. Verificato `app_private.demo_reset_runs=0` dopo i test: nessun reset effettivo eseguito.

## Limiti consapevoli del rilascio v1
- La baseline è legata alle 3 agenzie e ai 12 memoriali già esistenti: se vengono creati nuovi record root DEMO, il reset **si blocca** in sicurezza invece di cancellarli senza mappatura.
- Non ripristina file Storage esterni; foto e ritratto sono attualmente URL/asset già esistenti.
- Non resetta Auth users, log append-only, audit o contatti reali.
- Non è ancora presente un test E2E del form tramite browser autenticato SuperAdmin.
- Se in futuro sono aggiunte tabelle dipendenti con FK o workflow, estendere allowlist, baseline e test prima di considerare il reset completo.
- Le conferme extra non sostituiscono i permessi backend; le RPC verificano OWNER.

## Verifica manuale suggerita
Aprire `/console/piattaforma/reset-demo` con SuperAdmin. Verificare conteggi, modificare Giovanni dalla console, ripetere preview, digitare conferma e ripristinare; verificare `/memoriale/demo` e il numero di pensieri/ricordi.

Non dichiarare test E2E superato prima della prova reale con sessione SuperAdmin.
