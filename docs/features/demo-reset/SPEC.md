# Reset DEMO permanente — contratto di implementazione (Issue #6)

Stato: SPECIFICATO, NON IMPLEMENTATO. Questo documento non autorizza l'esecuzione di SQL distruttivo.

## Obiettivo
SuperAdmin > Impostazioni > Reset Demo Data ripristina integralmente la fixture DEMO, consentendo di testare come Agenzia, Famiglia e Visitatore senza perdere lo stato iniziale. Caso guida: Giovanni Rossi (M01), pagina /memoriale/demo.

## Baseline da versionare prima del reset
Lo schema Supabase LIVE non coincide con gli script SQL preliminari allegati: NON eseguire 16_DUMMY_SETUP_RESET.sql o altri script legacy sulla produzione.
Identità DEMO: agencies.is_demo/demo_code e memorials.is_demo/demo_code. Prima della prima migrazione salvare manifest versionato di tutte le righe e delle dipendenze e inventario degli asset Storage; confrontare conteggi, checksum e chiavi prima di qualsiasi DELETE/UPDATE.
Tabelle da classificare esplicitamente nel manifest: agencies, agency_members, memorials, family_members, memorial_memories, memorial_thoughts, memorial_public_demo_profiles, memorial_public_demo_photos, memorial_visual_settings, memorial_presentation_audit, memorial_demo_slots, eventuali inviti e notifiche sandbox. Nessun reset automatico di auth.users, platform_change_log o platform_operator_context_events.

## Limiti di sicurezza vincolanti
1. Solo PLATFORM_OWNER autenticato può richiedere preview/reset; enforce server-side e DB, non soltanto UI. Richiesta protetta da CSRF, rate limit, ri-verifica sessione per operazione sensibile.
2. Reset ammesso solo su allowlist deterministica di ID e dipendenze DEMO con controllo ownership/is_demo. Vietato TRUNCATE e query non delimitate. Abortire se una dipendenza non DEMO punta a fixture da rimuovere.
3. Acquisire advisory lock transazionale per serializzare reset e scritture demo; transazione unica per righe DB. Se Storage richiede operazioni esterne, usare manifest, staged objects e compensazioni: non dichiarare atomicità DB+Storage.
4. Non inviare email o pagamenti reali. Non modificare mai dati reali. I record DEMO restano esclusi da KPI, fatturato e campagne vere.
5. Le entry di audit persistono append-only: chi ha ripristinato, quando, manifest versione, conteggi before/after, correlation ID; non loggare segreti, dati privati o token in chiaro.
6. UI con pagina di preview: ID/nome della fixture, riepilogo oggetti da ripristinare e differenze, campo di conferma testuale, pulsante che si abilita solo con conferma, esito + errori leggibili. Non esporre bottone operativo prima della disponibilità del servizio sicuro.

## Sequenza implementativa
A. Ispezione schema live e inventario referential integrity, trigger, RPC, storage; estrazione fixture canonica, identificatori stabili e checksum.
B. Funzioni DB di preview e restore progettate in schema non esposto; permission grants minimi e RLS negative tests.
C. Endpoint server con idempotency key; autenticazione OWNER; audit e rollback.
D. Schermata SuperAdmin Impostazioni > Reset Demo Data.
E. Integrazione editor DEMO e verifica end-to-end.

## Acceptance
- Modificare nome/dedica/biografia di M01, aggiungere ricordo e pensiero, approvare/rifiutare, cambiare scenografia e profilo agenzia DEMO; effettuare reset; confrontare fixture corrente con manifest originale.
- Ripetizione reset senza modifiche -> stato invariato.
- Utenti non owner e agenzie -> 403, nessun effetto DB.
- Qualsiasi riga non-demo resta byte-per-byte invariata per i campi applicativi.
- Errore intermedio -> rollback e audit del fallimento, niente dati demo parziali.
- Asset demo esterni ripristinati o esplicitamente segnalati come non coperti, mai successo fittizio.
- Prima di usare in Production: test su DB isolato, migrazione versionata, CI, Playwright, verifica runtime e approvazione esplicita del change set DB.

## Dependency
Issue #5 — Demo realmente editabile. La funzione di reset deve includere anche tutti i tipi di nuovo record creati da quella funzionalità, non solo le 12 righe memorials.
