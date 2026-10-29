# ADR — SuperAdmin operativo e permessi staff per feature
Approvazione: 23/10/2026. Questa decisione aggiorna e prevale sulla matrice operativa precedente per i ruoli di piattaforma. **Non conferisce automaticamente accesso pubblico o anonimo.**

## Ruoli
- **SuperAdmin / PLATFORM_OWNER**: unico titolare; accesso a tutte le aree funzionali di piattaforma, agenzie e famiglie, inclusi workflow create/read/update/delete ed operazioni specialistiche (pubblicazione, moderazione, inviti, rinnovi, stati, amministrazione). Non basta una vista read-only. Le operazioni con rilevanza economica, irreversibili, o su dati privati richiedono motivazione, conferma, reautenticazione quando dovuta, e audit immutabile. Non si modifica implicitamente il ruolo di una famiglia e non si aggirano le verifiche privacy.
- **ADMIN / PLATFORM_ADMIN**: nominato e revocato *solo dal SuperAdmin*. Nessun potere implicito ereditato da piattaforma, agenzie o famiglie: ogni azione richiede una capability esplicita per feature. Può nominare/revocare **CUSTOMER CARE** se possiede `staff.manage`, mai creare o promuovere un SuperAdmin o un Admin.
- **CUSTOMER CARE / PLATFORM_SUPPORT**: nominato da SuperAdmin o da Admin con `staff.manage`. Anche qui tutte le capability partono negate.
- **FINANCE**: ruolo distinto già presente, da integrare nella stessa verifica per feature prima dell'apertura delle operazioni.

## Matrice configurabile individuale
Per ogni account staff e ogni feature: **C** create, **R** read, **U** update, **D** delete, ciascuna impostabile separatamente. Aggiungere **A** per azioni operative non riducibili a CRUD: approva pubblicazione, modera contenuti, sospende agenzia, emette rimborso, rinnova conservazione, cambia proprietario, gestisce permessi.

Prime feature:
- `agencies.profile`, `agencies.members`, `agencies.plans`, `agencies.billing`, `agencies.status`
- `memorials.registry`, `memorials.lifecycle`, `memorials.publication`, `memorials.preservation`
- `families.members`, `families.profile`, `families.memories`, `families.thoughts`, `families.contacts`, `families.reminders`, `families.privacy`
- `support.tickets`, `support.incidents`, `economy.transactions`, `economy.invoices`, `economy.reserve`, `statistics.reports`, `settings.pricing`, `settings.providers`, `settings.staff`, `settings.audit`

Scoping di assegnazione: inizialmente `ALL`, `AGENCY` (agency_id), `MEMORIAL` (memorial_id); i permessi granulari possono essere ulteriormente ristretti. Non confondere `families.*` con `agencies.*`: un Admin può essere operativo esclusivamente sulle famiglie, un altro esclusivamente sulle agenzie.

## Sicurezza ed esecuzione
1. Autorizzare sempre lato server e nei metodi RPC/RLS; mai basarsi su menu nascosti. Default deny.
2. Ogni invocazione operativa porta actor, ruolo, feature, azione, target, scope; nessuna impersonificazione silenziosa.
3. Per le azioni in nome di agenzia/famiglia: operazione delegata tracciata; distinguere chi l'ha compiuta dal titolare del memoriale.
4. Audit di concessioni/revoche e di ogni operazione sensibile: prima/dopo, timestamp, reason, actor, target e correlation id, escludendo token/credenziali/testi privati.
5. Rimozione ruolo, disattivazione account, o revoca capability hanno effetto immediato in autorizzazione backend.
6. `DELETE` CRUD non autorizza da solo cancellazioni legali/irrevocabili; sono richieste capability aggiuntive, controllo di retention e conferma.
7. Se `SUPPORT` viene mostrato come `CUSTOMER CARE`, mantenere compatibilità del DB fino a migrazione controllata.

## UI
SuperAdmin → Impostazioni → Staff e permessi. Griglia per persona con gruppo feature, caselle C/R/U/D, colonna azioni speciali e ambito; pulsanti Salva, Ripristina, Cronologia audit. Nessuna assegnazione automatica in base alla pagina visitata.

## Stato al 23/10/2026
**Decisione registrata; non ancora autorizzazioni operative implementate.** La persistenza e l'enforcement della matrice, la UI di gestione, e i test cross-tenant devono essere sviluppati prima di considerare la feature completa. Il SuperAdmin attuale non dispone ancora di tutte le operazioni Agenzia/Famiglia.

## Decisione aggiuntiva approvata — SuperAdmin «Apri come» (29/10/2026)
Il SuperAdmin dispone di un'azione contestuale **«Apri come → Agenzia / Famiglia»** nelle schede di agenzie e memoriali; può passare alla corrispondente esperienza operativa senza uscire dal proprio account. Non è una semplice anteprima statica: può utilizzare le funzioni autorizzate del relativo ambiente, inclusa la modifica dei dati DEMO e reali, con identità SuperAdmin invariata.

**Modalità:**
1. **Visualizza come**: navigazione e layout coerenti con l'area selezionata e i suoi dati, senza mutazioni. Barra persistente «Stai visualizzando come SuperAdmin — Agenzia/Famiglia [entità]» e «Torna a SuperAdmin».
2. **Intervieni come SuperAdmin**: capacità CRUD/azioni speciali accordate al PLATFORM_OWNER secondo il modello di autorizzazione backend; prima di ogni operazione critica serve motivazione e conferma. Non attribuire l'azione al titolare della famiglia o all'operatore dell'agenzia.
3. Permessi dell'utente simulato **non** vengono alterati. Nessun login con credenziali di terzi, impersonificazione nascosta o bypass generico del controllo privacy.
4. Sessione contestualizzata a uno specifico `agency_id` o `memorial_id`. Le chiamate RPC devono verificare il PLATFORM_OWNER e registrare actor effettivo, contesto «Apri come», target, prima/dopo, motivo, timestamp e correlation id.
5. Le modifiche sono persistite nel database di dominio, mai in liste hardcoded; devono essere visibili nel registro audit del SuperAdmin, comprese quelle su dati DEMO.
6. La funzione è disponibile solo al PLATFORM_OWNER. Un eventuale accesso ADMIN/Customer Care richiede un'ulteriore decisione e una capability esplicita, non ereditata.

**UX target:** dalla scheda SuperAdmin di un'agenzia o memoriale, menu «Apri come» con «Agenzia» e/o «Famiglia» a seconda del contesto; breadcrumb, banner di contesto, pulsante per uscire dalla vista. La modalità deve essere chiaramente distinguibile da una vera sessione Agenzia/Famiglia.

**Stato:** decisione approvata e documentata; UI contestuale, backend dei comandi delegati e test autorizzativi sono **da implementare**, non considerati esistenti solo perché registrati in ADR.
