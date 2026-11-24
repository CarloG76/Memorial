# MEMORIAL — Functional Testbook UAT-01

Baseline: 24/11/2026. Progetto Testiny `MEMOR`, Test Run `TR-1`. Tutti i casi inizialmente NOT RUN.

## Regole operative
- Testare solo funzionalità esistenti, non mock o placeholder.
- Usare staging per modifiche che creano contenuti o pubblicano memoriali; non pubblicare Gino in produzione.
- Registrare caso, account, build, esito, screenshot e risultato effettivo. PASSED solo se realmente eseguito.


## 02 · Identità, login e registrazione

### [FT-001] Login SuperAdmin
Testiny TC-1 | Tipo: FUNCTIONAL | Priorità: 0
Precondizione: UAT/staging, account di prova autorizzato e dati ripristinabili. Se il test modifica un memoriale o pubblica contenuti, usare staging o fixture dedicata; non pubblicare Gino in produzione.
1. **Azione:** Accedere con credenziali UAT SuperAdmin
   **Atteso:** Si apre la dashboard SuperAdmin con menu di piattaforma
2. **Azione:** Ricaricare la schermata e verificare la persistenza/assenza degli effetti secondo l'azione svolta. Registrare screenshot, account/ruolo e dati utilizzati.
   **Atteso:** Il comportamento resta coerente con l'esito del test; nessuna modifica inattesa a dati di altre persone.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-002] Login Agenzia Owner
Testiny TC-2 | Tipo: FUNCTIONAL | Priorità: 0
Precondizione: UAT/staging, account di prova autorizzato e dati ripristinabili. Se il test modifica un memoriale o pubblica contenuti, usare staging o fixture dedicata; non pubblicare Gino in produzione.
1. **Azione:** Accedere con credenziali UAT Owner Aurora
   **Atteso:** Si apre dashboard Agenzia con memoriali di Aurora
2. **Azione:** Ricaricare la schermata e verificare la persistenza/assenza degli effetti secondo l'azione svolta. Registrare screenshot, account/ruolo e dati utilizzati.
   **Atteso:** Il comportamento resta coerente con l'esito del test; nessuna modifica inattesa a dati di altre persone.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-003] Login Famiglia Owner
Testiny TC-3 | Tipo: FUNCTIONAL | Priorità: 0
Precondizione: UAT/staging, account di prova autorizzato e dati ripristinabili. Se il test modifica un memoriale o pubblica contenuti, usare staging o fixture dedicata; non pubblicare Gino in produzione.
1. **Azione:** Accedere con credenziali UAT Family Owner Gino
   **Atteso:** Si apre dashboard Famiglia con il memoriale assegnato
2. **Azione:** Ricaricare la schermata e verificare la persistenza/assenza degli effetti secondo l'azione svolta. Registrare screenshot, account/ruolo e dati utilizzati.
   **Atteso:** Il comportamento resta coerente con l'esito del test; nessuna modifica inattesa a dati di altre persone.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-004] Credenziali errate
Testiny TC-4 | Tipo: FUNCTIONAL | Priorità: 1
Precondizione: UAT/staging, account di prova autorizzato e dati ripristinabili. Se il test modifica un memoriale o pubblica contenuti, usare staging o fixture dedicata; non pubblicare Gino in produzione.
1. **Azione:** Inserire email valida e password errata
   **Atteso:** Errore di autenticazione, nessun accesso ai contenuti
2. **Azione:** Ricaricare la schermata e verificare la persistenza/assenza degli effetti secondo l'azione svolta. Registrare screenshot, account/ruolo e dati utilizzati.
   **Atteso:** Il comportamento resta coerente con l'esito del test; nessuna modifica inattesa a dati di altre persone.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-005] Logout e nuovo accesso
Testiny TC-5 | Tipo: FUNCTIONAL | Priorità: 1
Precondizione: UAT/staging, account di prova autorizzato e dati ripristinabili. Se il test modifica un memoriale o pubblica contenuti, usare staging o fixture dedicata; non pubblicare Gino in produzione.
1. **Azione:** Accedere, effettuare logout e riaprire /console
   **Atteso:** La pagina richiede nuovamente autenticazione
2. **Azione:** Ricaricare la schermata e verificare la persistenza/assenza degli effetti secondo l'azione svolta. Registrare screenshot, account/ruolo e dati utilizzati.
   **Atteso:** Il comportamento resta coerente con l'esito del test; nessuna modifica inattesa a dati di altre persone.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-006] Cambio password da account
Testiny TC-6 | Tipo: FUNCTIONAL | Priorità: 1
Precondizione: UAT/staging, account di prova autorizzato e dati ripristinabili. Se il test modifica un memoriale o pubblica contenuti, usare staging o fixture dedicata; non pubblicare Gino in produzione.
1. **Azione:** Aprire /account/password e compilare su utente UAT dedicato
   **Atteso:** Il cambio password termina correttamente e nuova password valida
2. **Azione:** Ricaricare la schermata e verificare la persistenza/assenza degli effetti secondo l'azione svolta. Registrare screenshot, account/ruolo e dati utilizzati.
   **Atteso:** Il comportamento resta coerente con l'esito del test; nessuna modifica inattesa a dati di altre persone.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-007] Pagina registrazione e gate
Testiny TC-7 | Tipo: FUNCTIONAL | Priorità: 1
Precondizione: UAT/staging, account di prova autorizzato e dati ripristinabili. Se il test modifica un memoriale o pubblica contenuti, usare staging o fixture dedicata; non pubblicare Gino in produzione.
1. **Azione:** Aprire /registrati e verificare il percorso disponibile
   **Atteso:** La UI rispetta il gate di registrazione configurato senza creare account fittizi
2. **Azione:** Ricaricare la schermata e verificare la persistenza/assenza degli effetti secondo l'azione svolta. Registrare screenshot, account/ruolo e dati utilizzati.
   **Atteso:** Il comportamento resta coerente con l'esito del test; nessuna modifica inattesa a dati di altre persone.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-008] Invito Family Owner
Testiny TC-8 | Tipo: FUNCTIONAL | Priorità: 0
Precondizione: UAT/staging, account di prova autorizzato e dati ripristinabili. Se il test modifica un memoriale o pubblica contenuti, usare staging o fixture dedicata; non pubblicare Gino in produzione.
1. **Azione:** Aprire un link invito famiglia UAT valido e accettare
   **Atteso:** L'account previsto riceve la membership e accede al memoriale
2. **Azione:** Ricaricare la schermata e verificare la persistenza/assenza degli effetti secondo l'azione svolta. Registrare screenshot, account/ruolo e dati utilizzati.
   **Atteso:** Il comportamento resta coerente con l'esito del test; nessuna modifica inattesa a dati di altre persone.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-009] Invito titolare Agenzia
Testiny TC-9 | Tipo: FUNCTIONAL | Priorità: 1
Precondizione: UAT/staging, account di prova autorizzato e dati ripristinabili. Se il test modifica un memoriale o pubblica contenuti, usare staging o fixture dedicata; non pubblicare Gino in produzione.
1. **Azione:** Aprire link invito titolare UAT e completare il flusso
   **Atteso:** Ruolo Owner collegato all'agenzia invitante; nessuna assegnazione multipla
2. **Azione:** Ricaricare la schermata e verificare la persistenza/assenza degli effetti secondo l'azione svolta. Registrare screenshot, account/ruolo e dati utilizzati.
   **Atteso:** Il comportamento resta coerente con l'esito del test; nessuna modifica inattesa a dati di altre persone.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

## 04 · SuperAdmin e audit

### [FT-010] Catalogo agenzie SuperAdmin
Testiny TC-10 | Tipo: FUNCTIONAL | Priorità: 1
Precondizione: UAT/staging, account di prova autorizzato e dati ripristinabili. Se il test modifica un memoriale o pubblica contenuti, usare staging o fixture dedicata; non pubblicare Gino in produzione.
1. **Azione:** Accedere come SuperAdmin; aprire Agenzie
   **Atteso:** Sono visualizzate le agenzie presenti nel DB, comprese DEMO correttamente etichettate
2. **Azione:** Ricaricare la schermata e verificare la persistenza/assenza degli effetti secondo l'azione svolta. Registrare screenshot, account/ruolo e dati utilizzati.
   **Atteso:** Il comportamento resta coerente con l'esito del test; nessuna modifica inattesa a dati di altre persone.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-011] Catalogo memoriali SuperAdmin
Testiny TC-11 | Tipo: FUNCTIONAL | Priorità: 0
Precondizione: UAT/staging, account di prova autorizzato e dati ripristinabili. Se il test modifica un memoriale o pubblica contenuti, usare staging o fixture dedicata; non pubblicare Gino in produzione.
1. **Azione:** Aprire Memoriali, cercare Gino Fustellati
   **Atteso:** Compare M13 e si apre la scheda corretta, senza Giovanni Rossi
2. **Azione:** Ricaricare la schermata e verificare la persistenza/assenza degli effetti secondo l'azione svolta. Registrare screenshot, account/ruolo e dati utilizzati.
   **Atteso:** Il comportamento resta coerente con l'esito del test; nessuna modifica inattesa a dati di altre persone.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-012] Filtro DEMO SuperAdmin
Testiny TC-12 | Tipo: FUNCTIONAL | Priorità: 1
Precondizione: UAT/staging, account di prova autorizzato e dati ripristinabili. Se il test modifica un memoriale o pubblica contenuti, usare staging o fixture dedicata; non pubblicare Gino in produzione.
1. **Azione:** Applicare filtro DEMO e tornare alla lista
   **Atteso:** Il risultato segue il filtro selezionato e non include record incoerenti
2. **Azione:** Ricaricare la schermata e verificare la persistenza/assenza degli effetti secondo l'azione svolta. Registrare screenshot, account/ruolo e dati utilizzati.
   **Atteso:** Il comportamento resta coerente con l'esito del test; nessuna modifica inattesa a dati di altre persone.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-013] Editing SuperAdmin su memoriale DEMO
Testiny TC-13 | Tipo: FUNCTIONAL | Priorità: 1
Precondizione: UAT/staging, account di prova autorizzato e dati ripristinabili. Se il test modifica un memoriale o pubblica contenuti, usare staging o fixture dedicata; non pubblicare Gino in produzione.
1. **Azione:** Aprire scheda memoriale DEMO, modificare testo reversibile e salvare
   **Atteso:** Dopo refresh la modifica persiste e nello storico è attribuita all'operatore
2. **Azione:** Ricaricare la schermata e verificare la persistenza/assenza degli effetti secondo l'azione svolta. Registrare screenshot, account/ruolo e dati utilizzati.
   **Atteso:** Il comportamento resta coerente con l'esito del test; nessuna modifica inattesa a dati di altre persone.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-014] Audit attività piattaforma
Testiny TC-14 | Tipo: FUNCTIONAL | Priorità: 1
Precondizione: UAT/staging, account di prova autorizzato e dati ripristinabili. Se il test modifica un memoriale o pubblica contenuti, usare staging o fixture dedicata; non pubblicare Gino in produzione.
1. **Azione:** Eseguire una modifica reversibile DEMO e consultare audit
   **Atteso:** L'azione è reperibile per autore/target/data, senza dati sensibili
2. **Azione:** Ricaricare la schermata e verificare la persistenza/assenza degli effetti secondo l'azione svolta. Registrare screenshot, account/ruolo e dati utilizzati.
   **Atteso:** Il comportamento resta coerente con l'esito del test; nessuna modifica inattesa a dati di altre persone.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-015] Anteprima reset DEMO
Testiny TC-15 | Tipo: FUNCTIONAL | Priorità: 1
Precondizione: UAT/staging, account di prova autorizzato e dati ripristinabili. Se il test modifica un memoriale o pubblica contenuti, usare staging o fixture dedicata; non pubblicare Gino in produzione.
1. **Azione:** Aprire Impostazioni → Reset Dummy Data e chiedere anteprima
   **Atteso:** Viene mostrato un riepilogo senza modificare i dati
2. **Azione:** Ricaricare la schermata e verificare la persistenza/assenza degli effetti secondo l'azione svolta. Registrare screenshot, account/ruolo e dati utilizzati.
   **Atteso:** Il comportamento resta coerente con l'esito del test; nessuna modifica inattesa a dati di altre persone.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

## 05 · Agenzia, team e onboarding

### [FT-016] Dashboard Agenzia
Testiny TC-16 | Tipo: FUNCTIONAL | Priorità: 0
Precondizione: UAT/staging, account di prova autorizzato e dati ripristinabili. Se il test modifica un memoriale o pubblica contenuti, usare staging o fixture dedicata; non pubblicare Gino in produzione.
1. **Azione:** Accedere come Agency Owner e aprire Dashboard
   **Atteso:** Nome agenzia, conteggi e memoriali associati sono coerenti con DB
2. **Azione:** Ricaricare la schermata e verificare la persistenza/assenza degli effetti secondo l'azione svolta. Registrare screenshot, account/ruolo e dati utilizzati.
   **Atteso:** Il comportamento resta coerente con l'esito del test; nessuna modifica inattesa a dati di altre persone.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-017] Ricerca memoriali Agenzia
Testiny TC-17 | Tipo: FUNCTIONAL | Priorità: 0
Precondizione: UAT/staging, account di prova autorizzato e dati ripristinabili. Se il test modifica un memoriale o pubblica contenuti, usare staging o fixture dedicata; non pubblicare Gino in produzione.
1. **Azione:** Aprire Memoriali e cercare Gino; applicare filtro di stato
   **Atteso:** Solo i memoriali corrispondenti sono elencati
2. **Azione:** Ricaricare la schermata e verificare la persistenza/assenza degli effetti secondo l'azione svolta. Registrare screenshot, account/ruolo e dati utilizzati.
   **Atteso:** Il comportamento resta coerente con l'esito del test; nessuna modifica inattesa a dati di altre persone.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-018] Dettaglio memoriale Agenzia
Testiny TC-18 | Tipo: FUNCTIONAL | Priorità: 0
Precondizione: UAT/staging, account di prova autorizzato e dati ripristinabili. Se il test modifica un memoriale o pubblica contenuti, usare staging o fixture dedicata; non pubblicare Gino in produzione.
1. **Azione:** Aprire dettaglio Gino dalla lista
   **Atteso:** Nome, tipo, stato, visibilità e data visualizzati correttamente
2. **Azione:** Ricaricare la schermata e verificare la persistenza/assenza degli effetti secondo l'azione svolta. Registrare screenshot, account/ruolo e dati utilizzati.
   **Atteso:** Il comportamento resta coerente con l'esito del test; nessuna modifica inattesa a dati di altre persone.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-019] Salvataggio profilo Agenzia
Testiny TC-19 | Tipo: FUNCTIONAL | Priorità: 1
Precondizione: UAT/staging, account di prova autorizzato e dati ripristinabili. Se il test modifica un memoriale o pubblica contenuti, usare staging o fixture dedicata; non pubblicare Gino in produzione.
1. **Azione:** Aprire La mia agenzia, cambiare città/email UAT e salvare
   **Atteso:** Dopo refresh i recapiti persistono; ripristinare i valori originali
2. **Azione:** Ricaricare la schermata e verificare la persistenza/assenza degli effetti secondo l'azione svolta. Registrare screenshot, account/ruolo e dati utilizzati.
   **Atteso:** Il comportamento resta coerente con l'esito del test; nessuna modifica inattesa a dati di altre persone.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-020] Invito operatore Agenzia
Testiny TC-20 | Tipo: FUNCTIONAL | Priorità: 1
Precondizione: UAT/staging, account di prova autorizzato e dati ripristinabili. Se il test modifica un memoriale o pubblica contenuti, usare staging o fixture dedicata; non pubblicare Gino in produzione.
1. **Azione:** Aprire gestione team da account Owner e invitare email test
   **Atteso:** Invito creato, visibile e revocabile dall'interfaccia
2. **Azione:** Ricaricare la schermata e verificare la persistenza/assenza degli effetti secondo l'azione svolta. Registrare screenshot, account/ruolo e dati utilizzati.
   **Atteso:** Il comportamento resta coerente con l'esito del test; nessuna modifica inattesa a dati di altre persone.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-021] Saldo attivazioni gratuite
Testiny TC-21 | Tipo: FUNCTIONAL | Priorità: 1
Precondizione: Accedere come Owner di agenzia UAT non DEMO con entitlement configurato
1. **Azione:** Aprire Memoriali e leggere le attivazioni gratuite residue
   **Atteso:** Il contatore riflette il saldo DB dell'agenzia e non inventa crediti
2. **Azione:** Ricaricare la pagina, verificare il dato e registrare screenshot/esito effettivo.
   **Atteso:** Risultato ancora coerente; i dati di test sono ripristinabili.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-022] Creazione memoriale gratuito
Testiny TC-22 | Tipo: FUNCTIONAL | Priorità: 1
Precondizione: In staging: agenzia UAT con diritto gratuito disponibile e indirizzo email famiglia di prova
1. **Azione:** Inserire nome defunto, tipologia, email e confermare creazione
   **Atteso:** Viene creato un solo memoriale privato, un invito famiglia e viene consumato un solo diritto gratuito
2. **Azione:** Ricaricare la pagina, verificare il dato e registrare screenshot/esito effettivo.
   **Atteso:** Risultato ancora coerente; i dati di test sono ripristinabili.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

## 06 · Commerciale e pagamenti

### [FT-023] Visualizzazione listino informativo Agenzia
Testiny TC-23 | Tipo: FUNCTIONAL | Priorità: 1
Precondizione: Accesso Agency Owner. Testare la sezione Amministrazione non come pagamento, ma come sola informazione prezzo.
1. **Azione:** Aprire Agenzia → Amministrazione e consultare il listino informativo.
   **Atteso:** I valori corrispondono al listino approvato PAYG 19,90/22,90, Pro mensile 39,90 + 13,90/16,90, Pro annuale 379 + 11,90/14,90, senza suggerire un checkout realmente abilitato.
2. **Azione:** Ricaricare e navigare tra le sezioni.
   **Atteso:** I prezzi rimangono coerenti con la configurazione presentata.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-024] Amministrazione Agenzia: stato e informazioni fatturazione
Testiny TC-24 | Tipo: FUNCTIONAL | Priorità: 1
Precondizione: Accesso Agency Owner con dati di un'agenzia UAT.
1. **Azione:** Aprire Agenzia → Amministrazione e controllare piano, dati dell'organizzazione, prezzi informativi e memoriali registrati.
   **Atteso:** Piano e stato vengono letti dal database; nessun pagamento reale viene presentato come completato.
2. **Azione:** Ricaricare la sezione.
   **Atteso:** Stato e valori rimangono coerenti; le parti non implementate sono dichiarate tali.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

## 07 · Famiglia: inviti, editor e media

### [FT-025] Apertura editor Famiglia
Testiny TC-25 | Tipo: FUNCTIONAL | Priorità: 1
Precondizione: Login Family Owner associato a Gino Fustellati
1. **Azione:** Aprire Famiglia → Profilo e storia
   **Atteso:** Editor mostra Gino con nome, dedica, biografia, timeline e ritratto corrispondenti al DB
2. **Azione:** Ricaricare la pagina, verificare il dato e registrare screenshot/esito effettivo.
   **Atteso:** Risultato ancora coerente; i dati di test sono ripristinabili.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-026] Modifica biografia e dedica persistente
Testiny TC-26 | Tipo: FUNCTIONAL | Priorità: 1
Precondizione: Usare Family Owner su memoriale DEMO reversibile; annotare valori originali
1. **Azione:** Modificare dedica e biografia, salvare e ricaricare
   **Atteso:** I nuovi testi persistono nel DB e ricompaiono nell'editor; il ritratto non viene perso
2. **Azione:** Ricaricare la pagina, verificare il dato e registrare screenshot/esito effettivo.
   **Atteso:** Risultato ancora coerente; i dati di test sono ripristinabili.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-027] Creazione e validazione tappa timeline
Testiny TC-27 | Tipo: FUNCTIONAL | Priorità: 1
Precondizione: Editor Profilo e storia aperto; test con dati reversibili
1. **Azione:** Aggiungere data valida, titolo e descrizione; salvare; poi provare una data impossibile
   **Atteso:** La tappa lecita persiste; il dato impossibile viene rifiutato e non altera la timeline
2. **Azione:** Ricaricare la pagina, verificare il dato e registrare screenshot/esito effettivo.
   **Atteso:** Risultato ancora coerente; i dati di test sono ripristinabili.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-028] Caricamento ritratto persistente
Testiny TC-28 | Tipo: FUNCTIONAL | Priorità: 1
Precondizione: Possedere file JPG/PNG/WebP < 5 MB autorizzato per il memoriale DEMO
1. **Azione:** Caricare fotografia, premere Salva fotografia, ricaricare la pagina
   **Atteso:** Immagine visualizzata dopo refresh e URL collegata al memoriale corretto in Supabase
2. **Azione:** Ricaricare la pagina, verificare il dato e registrare screenshot/esito effettivo.
   **Atteso:** Risultato ancora coerente; i dati di test sono ripristinabili.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-029] File ritratto non valido
Testiny TC-29 | Tipo: FUNCTIONAL | Priorità: 0
Precondizione: Famiglia autorizzata, ritratto esistente non sacrificabile
1. **Azione:** Tentare upload PDF e file JPG >5MB
   **Atteso:** Messaggio d'errore e immagine precedente conservata
2. **Azione:** Ricaricare e verificare stato, persistenza ed evidenze; registrare esito senza presumerlo.
   **Atteso:** Comportamento coerente con il requisito. Test mutativi in staging o fixture ripristinabile.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-030] Ricordo familiare approvato subito
Testiny TC-30 | Tipo: FUNCTIONAL | Priorità: 0
Precondizione: Famiglia Owner/Editor con can_edit_content, memoriale UAT
1. **Azione:** In Ricordi inserire titolo e testo valido; salvare e ricaricare
   **Atteso:** Ricordo persistente con APPROVED e visitor_submitted=false
2. **Azione:** Ricaricare e verificare stato, persistenza ed evidenze; registrare esito senza presumerlo.
   **Atteso:** Comportamento coerente con il requisito. Test mutativi in staging o fixture ripristinabile.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-031] Selezione sfondo e anteprima
Testiny TC-31 | Tipo: FUNCTIONAL | Priorità: 0
Precondizione: Famiglia Owner con accesso Profilo e storia
1. **Azione:** Scegliere uno sfondo previsto, salvarlo e aprire anteprima
   **Atteso:** La grafica usa lo sfondo pubblicato previsto; scelta coerente dopo refresh
2. **Azione:** Ricaricare e verificare stato, persistenza ed evidenze; registrare esito senza presumerlo.
   **Atteso:** Comportamento coerente con il requisito. Test mutativi in staging o fixture ripristinabile.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

## 08 · Entra come Famiglia: Agenzia e SuperAdmin

### [FT-032] SuperAdmin Entra come Agenzia
Testiny TC-32 | Tipo: FUNCTIONAL | Priorità: 0
Precondizione: Login Platform Owner
1. **Azione:** Dalla lista Agenzie cliccare Entra come Agenzia per Aurora
   **Atteso:** Nuova scheda con menu Agenzia, banner SuperAdmin e dati Aurora
2. **Azione:** Ricaricare e verificare stato, persistenza ed evidenze; registrare esito senza presumerlo.
   **Atteso:** Comportamento coerente con il requisito. Test mutativi in staging o fixture ripristinabile.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-033] SuperAdmin Entra come Famiglia
Testiny TC-33 | Tipo: FUNCTIONAL | Priorità: 0
Precondizione: Login Platform Owner, target Gino M13
1. **Azione:** Aprire scheda Gino e scegliere Entra come Famiglia
   **Atteso:** Contesto Family di Gino con menu dedicato e banner identità reale
2. **Azione:** Ricaricare e verificare stato, persistenza ed evidenze; registrare esito senza presumerlo.
   **Atteso:** Comportamento coerente con il requisito. Test mutativi in staging o fixture ripristinabile.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-034] Agenzia Entra come Famiglia
Testiny TC-34 | Tipo: FUNCTIONAL | Priorità: 0
Precondizione: Login Agency Owner Aurora, memoriale Gino
1. **Azione:** Aprire dettaglio Gino, cliccare Entra come Famiglia
   **Atteso:** Nuova scheda delegata a Gino, avviso operatore e scadenza contesto
2. **Azione:** Ricaricare e verificare stato, persistenza ed evidenze; registrare esito senza presumerlo.
   **Atteso:** Comportamento coerente con il requisito. Test mutativi in staging o fixture ripristinabile.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-035] Uscita da contesto Agenzia Famiglia
Testiny TC-35 | Tipo: FUNCTIONAL | Priorità: 0
Precondizione: Contesto delegato Agenzia→Gino attivo
1. **Azione:** Premere Termina Entra come Famiglia e torna all'Agenzia; riaprire link vecchio
   **Atteso:** Ritorno Agenzia, contesto precedente non più utilizzabile
2. **Azione:** Ricaricare e verificare stato, persistenza ed evidenze; registrare esito senza presumerlo.
   **Atteso:** Comportamento coerente con il requisito. Test mutativi in staging o fixture ripristinabile.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-036] Pubblicazione delegata Agenzia
Testiny TC-36 | Tipo: FUNCTIONAL | Priorità: 0
Precondizione: Solo staging; memoriale DEMO idoneo con contenuti e immagine; Agency Owner autorizzato
1. **Azione:** Entrare come Famiglia, approvare con checkbox e pubblicare
   **Atteso:** Memoriale PUBLISHED_ACTIVE; audit actor reale e acting_as=AGENCY_AS_FAMILY
2. **Azione:** Ricaricare e verificare stato, persistenza ed evidenze; registrare esito senza presumerlo.
   **Atteso:** Comportamento coerente con il requisito. Test mutativi in staging o fixture ripristinabile.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-037] Pubblicazione delegata SuperAdmin
Testiny TC-37 | Tipo: FUNCTIONAL | Priorità: 0
Precondizione: Solo staging; memoriale idoneo e Platform Owner
1. **Azione:** Entrare come Famiglia e confermare pubblicazione
   **Atteso:** Audit con actor_id reale e acting_as=SUPERADMIN_AS_FAMILY
2. **Azione:** Registrare screenshot, dati usati e risultato reale; ripetere refresh dove appropriato.
   **Atteso:** Nessuna falsa conferma e nessuna modifica a memoriali non coinvolti.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

## 09 · Pubblicazione, stati, link e visibilità

### [FT-038] Checklist pubblicazione incompleta
Testiny TC-38 | Tipo: FUNCTIONAL | Priorità: 0
Precondizione: Family Owner Gino, memoriale ancora in preparazione
1. **Azione:** Aprire modulo Pubblicazione in Profilo e storia
   **Atteso:** Elenco requisiti mancanti e pulsante inattivo
2. **Azione:** Registrare screenshot, dati usati e risultato reale; ripetere refresh dove appropriato.
   **Atteso:** Nessuna falsa conferma e nessuna modifica a memoriali non coinvolti.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-039] Consenso pubblicazione obbligatorio
Testiny TC-39 | Tipo: FUNCTIONAL | Priorità: 0
Precondizione: Memoriale staging con tutti i requisiti soddisfatti
1. **Azione:** Tentare pubblicazione senza spuntare conferma
   **Atteso:** Il pulsante rimane disabilitato; nessuna pubblicazione
2. **Azione:** Registrare screenshot, dati usati e risultato reale; ripetere refresh dove appropriato.
   **Atteso:** Nessuna falsa conferma e nessuna modifica a memoriali non coinvolti.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-040] Prima pubblicazione e token
Testiny TC-40 | Tipo: FUNCTIONAL | Priorità: 0
Precondizione: Memoriale staging privato attivato e completo; Family Owner
1. **Azione:** Scegliere UNLISTED, confermare e pubblicare
   **Atteso:** PUBLISHED_ACTIVE, token di condivisione, first_published_at e covered_until registrati
2. **Azione:** Registrare screenshot, dati usati e risultato reale; ripetere refresh dove appropriato.
   **Atteso:** Nessuna falsa conferma e nessuna modifica a memoriali non coinvolti.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-041] Link dopo nuova sessione
Testiny TC-41 | Tipo: FUNCTIONAL | Priorità: 0
Precondizione: Fixture staging già pubblicata
1. **Azione:** Ricaricare modulo di pubblicazione e aprire link pubblico
   **Atteso:** Stato Pubblicato e link invariato; pagina del memoriale corretto
2. **Azione:** Registrare screenshot, dati usati e risultato reale; ripetere refresh dove appropriato.
   **Atteso:** Nessuna falsa conferma e nessuna modifica a memoriali non coinvolti.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-042] Anteprima privata di Gino
Testiny TC-42 | Tipo: FUNCTIONAL | Priorità: 0
Precondizione: Login Family Owner Gino o contesto autorizzato
1. **Azione:** Aprire anteprima Gino e confrontare pagina demo Giovanni
   **Atteso:** Gino mostra solo dati Gino; non è una pagina aperta a tutti
2. **Azione:** Registrare screenshot, dati usati e risultato reale; ripetere refresh dove appropriato.
   **Atteso:** Nessuna falsa conferma e nessuna modifica a memoriali non coinvolti.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-043] Token pubblico inesistente
Testiny TC-43 | Tipo: FUNCTIONAL | Priorità: 0
Precondizione: Nessuna autenticazione
1. **Azione:** Aprire /memoriale/p/ seguito da token inesistente ma ben formato
   **Atteso:** Pagina 404, nessun memoriale o dato privato esposto
2. **Azione:** Registrare screenshot, dati usati e risultato reale; ripetere refresh dove appropriato.
   **Atteso:** Nessuna falsa conferma e nessuna modifica a memoriali non coinvolti.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

## 10 · Visitatore: contenuti e moderazione

### [FT-044] Memoriale demo Giovanni
Testiny TC-44 | Tipo: FUNCTIONAL | Priorità: 0
Precondizione: Browser anonimo
1. **Azione:** Aprire /memoriale/demo e osservare nome e contenuti
   **Atteso:** Viene visualizzato Giovanni Rossi, non Gino
2. **Azione:** Registrare screenshot, dati usati e risultato reale; ripetere refresh dove appropriato.
   **Atteso:** Nessuna falsa conferma e nessuna modifica a memoriali non coinvolti.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-045] Invio ricordo con foto dal visitatore
Testiny TC-45 | Tipo: FUNCTIONAL | Priorità: 1
Precondizione: Browser anonimo, pagina DEMO o staging con form attivo, foto test valida
1. **Azione:** Compilare nome, testo e foto; inviare
   **Atteso:** Proposta creata PENDING e non pubblica prima della moderazione
2. **Azione:** Ricaricare e raccogliere schermate del risultato, senza modificare i dati DEMO baseline non ripristinabili.
   **Atteso:** Risultato stabile e verificabile.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-046] Lista proposte ricevute dalla famiglia
Testiny TC-46 | Tipo: FUNCTIONAL | Priorità: 1
Precondizione: Proposta visitatore test PENDING su memoriale UAT
1. **Azione:** Accedere Famiglia → Ricordi e aprire proposte
   **Atteso:** Compare la proposta con testo/fotografia e pulsanti Approva/Rifiuta
2. **Azione:** Ricaricare e raccogliere schermate del risultato, senza modificare i dati DEMO baseline non ripristinabili.
   **Atteso:** Risultato stabile e verificabile.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-047] Approvazione ricordo visitatore
Testiny TC-47 | Tipo: FUNCTIONAL | Priorità: 1
Precondizione: Proposta fotografica UAT PENDING, Family Owner
1. **Azione:** Premere Approva tutto e pubblica e ricaricare pubblico
   **Atteso:** Stato APPROVED; testo e foto accessibili solo dopo approvazione
2. **Azione:** Ricaricare e raccogliere schermate del risultato, senza modificare i dati DEMO baseline non ripristinabili.
   **Atteso:** Risultato stabile e verificabile.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-048] Rifiuto ricordo visitatore
Testiny TC-48 | Tipo: FUNCTIONAL | Priorità: 1
Precondizione: Proposta fotografica UAT PENDING, Family Owner
1. **Azione:** Premere Rifiuta e ricaricare pubblico
   **Atteso:** Stato REJECTED, contenuto non visibile pubblicamente
2. **Azione:** Ricaricare e raccogliere schermate del risultato, senza modificare i dati DEMO baseline non ripristinabili.
   **Atteso:** Risultato stabile e verificabile.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-049] Revoca ricordo approvato
Testiny TC-49 | Tipo: FUNCTIONAL | Priorità: 1
Precondizione: Proposta UAT già APPROVED, Family Owner
1. **Azione:** Nello storico premere Rimuovi dalla pubblicazione
   **Atteso:** Non appare più nella pagina pubblica; stato aggiornato
2. **Azione:** Ricaricare e raccogliere schermate del risultato, senza modificare i dati DEMO baseline non ripristinabili.
   **Atteso:** Risultato stabile e verificabile.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-050] Validazione proposta incompleta
Testiny TC-50 | Tipo: FUNCTIONAL | Priorità: 1
Precondizione: Browser anonimo su memoriale con proposta attiva
1. **Azione:** Inviare senza nome/testo obbligatori o con foto non valida
   **Atteso:** Messaggio errore, nessuna proposta pubblicata automaticamente
2. **Azione:** Ricaricare e raccogliere schermate del risultato, senza modificare i dati DEMO baseline non ripristinabili.
   **Atteso:** Risultato stabile e verificabile.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

## 13 · DEMO, dati e reset

### [FT-051] M01 Giovanni e M13 Gino separati
Testiny TC-51 | Tipo: FUNCTIONAL | Priorità: 1
Precondizione: DB DEMO corrente: M01 e M13, senza modifiche
1. **Azione:** Aprire pagina demo Giovanni e anteprima privata Gino
   **Atteso:** Nomi e contenuti non si sovrappongono; link corretti
2. **Azione:** Ricaricare e raccogliere schermate del risultato, senza modificare i dati DEMO baseline non ripristinabili.
   **Atteso:** Risultato stabile e verificabile.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

## 14 · UI, accessibilità, mobile e performance

### [FT-052] Navigazione desktop per ruolo
Testiny TC-52 | Tipo: FUNCTIONAL | Priorità: 1
Precondizione: Account UAT SuperAdmin, Agenzia, Famiglia
1. **Azione:** Aprire ogni menu e le pagine realmente implementate
   **Atteso:** Navigazione coerente con ruolo e senza URL hardcoded sbagliati
2. **Azione:** Ricaricare e raccogliere schermate del risultato, senza modificare i dati DEMO baseline non ripristinabili.
   **Atteso:** Risultato stabile e verificabile.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-053] Mobile Famiglia editor e foto
Testiny TC-53 | Tipo: FUNCTIONAL | Priorità: 1
Precondizione: Accedere su viewport 390px con Family Owner
1. **Azione:** Aprire Profilo e storia; utilizzare editor, carica foto, pulsanti
   **Atteso:** Elementi visibili e utilizzabili, nessun overflow orizzontale
2. **Azione:** Ricaricare e documentare risultato reale con screenshot.
   **Atteso:** Il comportamento è ripetibile senza ricorrere a modifiche SQL manuali.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-054] Mobile Agenzia lista e dettaglio
Testiny TC-54 | Tipo: FUNCTIONAL | Priorità: 1
Precondizione: Accedere su viewport 390px con Owner Agenzia
1. **Azione:** Aprire Memoriali, ricerca, dettaglio e Entra come Famiglia
   **Atteso:** Controlli raggiungibili, tabella leggibile e nessun bottone tagliato
2. **Azione:** Ricaricare e documentare risultato reale con screenshot.
   **Atteso:** Il comportamento è ripetibile senza ricorrere a modifiche SQL manuali.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

### [FT-055] Messaggi di successo ed errore coerenti
Testiny TC-55 | Tipo: FUNCTIONAL | Priorità: 1
Precondizione: Avere accesso a editor Famiglia e caricamento foto
1. **Azione:** Salvare contenuto valido e poi tentare dati invalidi
   **Atteso:** Successo solo dopo commit DB; errore leggibile senza perdita contenuti
2. **Azione:** Ricaricare e documentare risultato reale con screenshot.
   **Atteso:** Il comportamento è ripetibile senza ricorrere a modifiche SQL manuali.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

## 04 · SuperAdmin e audit

### [FT-056] Gestione gallery esistente SuperAdmin
Testiny TC-56 | Tipo: FUNCTIONAL | Priorità: 1
Precondizione: Platform Owner apre editor media memoriale DEMO reversibile
1. **Azione:** Aggiungere, modificare o rimuovere una voce gallery dalla UI esistente
   **Atteso:** Galleria e DB coerenti dopo refresh; solo media consentiti
2. **Azione:** Ricaricare e documentare risultato reale con screenshot.
   **Atteso:** Il comportamento è ripetibile senza ricorrere a modifiche SQL manuali.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

## 05 · Agenzia, team e onboarding

### [FT-057] Revoca invito operatore
Testiny TC-57 | Tipo: FUNCTIONAL | Priorità: 1
Precondizione: Agency Owner con invito operatore UAT ancora attivo
1. **Azione:** Revocare invito dalla gestione team
   **Atteso:** Stato invito revocato e token non utilizzabile
2. **Azione:** Ricaricare e documentare risultato reale con screenshot.
   **Atteso:** Il comportamento è ripetibile senza ricorrere a modifiche SQL manuali.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

## 07 · Famiglia: inviti, editor e media

### [FT-058] Visibilità ricordi dopo refresh
Testiny TC-58 | Tipo: FUNCTIONAL | Priorità: 1
Precondizione: Family Owner ha creato ricordo UAT approvato
1. **Azione:** Aprire pagina pubblica di fixture già pubblicata
   **Atteso:** Il ricordo approvato è presente; quelli PENDING/REJECTED non compaiono
2. **Azione:** Ricaricare e documentare risultato reale con screenshot.
   **Atteso:** Il comportamento è ripetibile senza ricorrere a modifiche SQL manuali.
**Esito:** NOT RUN. **Evidenza:** da allegare in Testiny.

## Fuori scope
Funzioni prive di codice operativo (Stripe reale, messaggi privati, anniversary/renewal, export statico, crowdfunding, PIN, AI miglioramento foto) non hanno casi di esecuzione. Checkout DEMO non è trattato come pagamento reale.

## Gate
Un test è PASS soltanto dopo esecuzione effettiva con evidenza. Build READY, test SQL storici e review statiche non equivalgono a test manuale utente.