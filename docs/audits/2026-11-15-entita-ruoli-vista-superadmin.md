# MEMORIAL — Audit incrociato entità / ruoli / pagine (15 novembre 2026)

## Perimetro e metodo
Verificato codice su `main`, schema/RPC e RLS sul progetto Supabase collegato, dati DEMO e deployment Vercel. Query di prova eseguite con JWT simulato e ruolo `authenticated` / `anon`; tutte le operazioni mutanti di prova racchiuse in una transazione con `ROLLBACK`. Non è stato eseguito un collaudo browser E2E con login reale. Non inseriti dati fittizi persistenti. Non usare `READY` come prova di test nel browser.

## Fixture osservata
- 3 agenzie A01 (PRO/attiva, 6 memoriali, OWNER attivo + 1 OPERATOR), A02 (FREE/attiva, 3 memoriali, OWNER attivo), A03 (FREE/chiusa, 3 memoriali, OWNER disattivato).
- 12 memoriali M01–M12 che coprono stati PUBLISHED_ACTIVE, PRESERVED_STATIC, DRAFT, PAYMENT_PENDING, SKELETON_ACTIVE, FAMILY_PREPARING, READY_FOR_PUBLICATION, EXPIRED, UNPUBLISHED_ARCHIVED, ARCHIVED, CLOSED, SUSPENDED.
- 10 associazioni family_members: 8 OWNER + 2 EDITOR, 0 VIEWER.
- M03, M04, M05 e M06 privi di utenti Famiglia associati. L'accesso contestuale SuperAdmin funziona comunque, ma non rappresenta un account familiare reale per questi casi.
- Tutte e 3 le agenzie DEMO hanno anagrafica OWNER a 4 campi ancora incompleta; nessun dato reale è stato inventato.

## Matrice operatività

| Entità / azione | Account reale | SuperAdmin dettaglio | SuperAdmin «Entra come» | Esito |
|---|---|---|---|---|
| Login piattaforma OWNER | Accesso diretto Dashboard | Dashboard globale | N/A | Implementato nel codice |
| Agenzia OWNER | Dashboard agenzia e memoriali, gestione titolare/operatori | Scheda agenzia, piano, memoriali e contatti | Dashboard, anagrafica agenzia, staff, memoriali | PARZIALE: schermate non identiche |
| Agenzia OPERATOR | Dashboard agenzia e 6 memoriali A01, senza gestione team | Visibile nello staff dell'agenzia | Entra come Agenzia fornisce permessi di SuperAdmin, non simula il ruolo limitato OPERATOR | PARZIALE per simulazione ruolo |
| Famiglia OWNER | Lista dei propri memoriali, ricordi/pensieri in lettura, editor sfondo | Scheda memoriale con famiglia e contributi | Editor nome, dedica, biografia, cronologia e contenuti con moderazione | **GAP CRITICO: parità editor** |
| Famiglia EDITOR | Lettura e preset secondo autorizzazioni attuali | Ruolo visibile | «Entra come» non simula i limiti specifici EDITOR | PARZIALE |
| Famiglia VIEWER | Ruolo definito, non ci sono fixture dimostrative VIEWER | Nessun test demo | Nessun test demo | NON VERIFICATO |
| Visitatore anonimo | M01 DEMO Premium pubblico: storia/foto, 1 ricordo e 1 pensiero APPROVATI | Stessa pagina M01 disponibile da scheda | Non applicabile | Lettura PASS, submit contributi NON operativo |
| Altri memoriali | Stati diversi; M02 UNLISTED e il resto non pubblico | SuperAdmin vede tutte le 12 schede | Apertura contesto Famiglia consentita | Non esistono 12 pagine pubbliche collaudabili |

## Test effettivi
1. A01 OWNER sotto JWT associato: RLS consente 1 agenzia, 6 memoriali, 2 memberships; snapshot team 2 persone. PASS.
2. A01 OPERATOR: RLS consente 1 agenzia e 6 memoriali; gestione team negata. PASS.
3. A02 OWNER che chiede snapshot team A01: `42501 NOT_AUTHORIZED`. PASS.
4. A03 OWNER disattivato: 0 agenzie e 0 memoriali visibili sotto RLS. PASS.
5. OWNER Famiglia M01: 2 memoriali correlati allo stesso utente, 2 ricordi e 2 pensieri; vista correttamente limitata agli oggetti associati. PASS.
6. SuperAdmin A01 tramite contesto: 6 memoriali e 2 utenti; contesto valido. PASS.
7. SuperAdmin Famiglia M01: 2 familiari con nome visualizzabile, 2 pensieri, 1 ricordo, cronologia disponibile. PASS.
8. Visitatore `anon`: chiamata alla RPC di proiezione pubblica consentita, con 1 ricordo e 1 pensiero approvati; lettura diretta della tabella `memorials` rifiutata. PASS.
9. Anagrafica Owner: prima prova con numero internazionale fallita per regex troppo escaped; corretto backend e frontend, secondo test PASS in ROLLBACK.
10. Invito OPERATOR: generazione token, accettazione con indirizzo verificato corretto, associazione OPERATOR creata, ROLLBACK. PASS.
11. Invito con email non corrispondente: `42501 INVITATION_EMAIL_MISMATCH`. PASS.
12. Reset DEMO dopo creazione temporanea di Owner Contact e invito: entrambi eliminati; transazione ROLLBACK. PASS.

## Correzioni già distribuite
- Scheda SuperAdmin Agenzia: nominativi, ruolo, email e telefono al posto degli UUID.
- «Entra come» Agenzia: stessa componente proprietario/team della Dashboard owner, con contatto completo e inviti.
- «Entra come» Famiglia: nominativi dei membri al posto degli UUID.
- Validazione di numeri internazionali corretta sia nel database sia nel form Owner.
- Inviti staff via link personale con email verificata, scadenza, revoca e abilitazione/disabilitazione.

## Gap di prodotto da sviluppare, ordinati
P0. Unificare editor e moderazione Famiglia tra accesso diretto e «Entra come», passando dallo stesso componente e autorizzazioni account Owner/Editor/Viewer; non clonare schermate diverse.
P0. Rendere l'anagrafica OWNER obbligatoria nel percorso di registrazione/completamento account, e non solo nel modulo di salvataggio.
P0. Attivare salvataggio reale e moderazione per contenuti dei visitatori; ora la pagina dimostrativa nega esplicitamente il salvataggio.
P1. Completare gestione profilo Agenzia per accesso diretto (`La mia agenzia`) e renderer SuperAdmin condivisi.
P1. Organizzare «Famiglie» in entità familiari e membership, non semplicemente un altro elenco memoriali.
P1. Integrare inviti email automatici (oggi link da condividere manualmente), verifica e rinnovi.
P1. Preparare demo con OWNER/EDITOR/VIEWER e verificare davvero restrizioni di ciascuno.
P1. Pagine pubbliche dei memoriali oltre M01 conformemente a status/visibility e autorizzazioni.
P2. Audit log utente/ora/azione consultabile; non richiedere motivazione obbligatoria.

## Risultato
La protezione dati tra agenzie e la lettura pubblica M01 risultano coerenti nei test DB. La parità operativa fra accesso familiare reale e «Entra come» NON è ancora raggiunta. La build Vercel in stato READY non sostituisce sessioni browser E2E.
