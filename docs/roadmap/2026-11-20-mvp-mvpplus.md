# MEMORIAL — Roadmap operativa MVP / MVP+ / post-MVP

Aggiornata: 24 novembre 2026 · Owner: Carlo Gonella. Questo documento rappresenta le decisioni successive alle specifiche iniziali. Una funzione è considerata completata solo se verificata nel DB, UI e test browser.

## Prezzi approvati più recenti
| Piano | Canone | Standard | Premium |
|---|---:|---:|---:|
| PAYG | €0 | €19,90 | €22,90 |
| Pro mensile | €39,90/mese | €13,90 | €16,90 |
| Pro annuale | €379/anno | €11,90 | €14,90 |

Prime **due attivazioni gratuite** per nuova agenzia secondo regola corrente. Prezzi precedenti di schede legacy e casi di test da aggiornare prima del pagamento reale.

## MVP 0 — Sicurezza, delega e consolidamento
- [x] Base Next.js / Supabase / Vercel, area ruoli e dati DEMO
- [x] Ritratti in Supabase Storage, metadati su DB
- [x] Anteprima privata per memoriale specifico, senza link generico Giovanni
- [x] Famiglia: ricordi diretti approvati, visitatori in moderazione
- [x] RPC pubblicazione familiare con condizioni, hash versione, audit, URL token e visibilità
- [x] **Pubblicazione in modalità "Entra come Famiglia" per Agenzia e SuperAdmin**: identità reale, contesto delegato verificato, hash versione, approvazione esplicita, audit actor e acting_as. Test SQL con rollback.
- [x] **Estensione editing Agenzia → Famiglia**: biografia, dedica, timeline, ricordi diretti approvati, moderazione visitatori con contesto valido. Test SQL di editor/ricordi/contesto superati; Edge Function v3 pubblicata; ritratto in contesto delegato con audit. **Non ancora collaudato via browser (Testiny FT-059…064 NOT RUN).**
- [ ] Test Playwright end-to-end con login Agenzia/SuperAdmin e accesso delegato (non sostituibile con SQL o build READY).
- [ ] Delimitazione autorizzazioni agency vs family: l'Agenzia non accede fuori dal proprio contesto a PII e contenuti, il ruolo delegato è esplicito, limitato e temporaneo
- [ ] Browser E2E con credenziali reali di test, test RLS e rollback/reset demo
- [ ] Integrazione UI upload e foto su ogni percorso, compreso controllo recupero dopo refresh

## MVP 1 — Ciclo commerciale
- [ ] Piano e listino unificati; checkout reale Stripe; ordini e webhook firmati/idempotenti
- [ ] Gratuiti 2 memoriali per agenzia, contabilità utilizzi e credit entitlement
- [ ] Subscription Pro mensile/annuale, gestione cambi piano, errori e cancellazioni
- [ ] Inviti familiari, notifiche e gestione fallimenti/rinvii
- [ ] Fatture e configurazione fiscale applicabile

## MVP 2 — Famiglia e pubblicazione
- [ ] Invito→login→editor→upload→anteprima→pubblicazione E2E
- [~] Galleria Premium familiare: upload JPG/PNG/WebP 5 MB, titolo, descrizione, ordine e rimozione metadata implementati, anche in contesto delegato. **Da collaudare nel browser, da completare gestione privacy URL/storage, gestione di eventuali file orfani e privacy URL/storage (rimozione file implementata best-effort, conferma diritti introdotta).**
- [ ] Distinzione Standard/Premium e validazione delle capability lato DB
- [ ] Impostazioni di privacy, PIN opzionale e consensi
- [ ] Pubblicazione diretta e delegata, link/QR stabile, notifiche

## MVP 3 — Esperienza visitatore
- [ ] Pagina pubblica definitiva mobile; pensieri moderati e ricordi con foto
- [ ] Messaggi privati approvati prima della consegna, destinatari verificati
- [ ] Protezione antispam, consensi separati e gestione recapiti facoltativi
- [ ] URL pubblico/unlisted e ricercabilità controllata
- [ ] Test anonymous vs autenticato, leakage, abuso upload

## MVP 4 — Conservazione e disponibilità
- [ ] Copertura contrattuale, rinnovi, scadenza e URL/QR persistente
- [ ] Archivio esportabile, backup e restore verificato
- [ ] Reminder, ricorrenze e 7 giorni di interazione, oppure esplicita limitazione del pilot
- [ ] Osservabilità, sicurezza, recovery e check operativi

## MVP+ — Ottimizzazione foto con AI (prima release dopo MVP)
- [ ] In **Famiglia → Ritratto**, pulsante «Migliora con AI» dopo il caricamento
- [ ] Correzione sobria di luminosità, contrasto, bilanciamento cromatico, rumore e nitidezza; ripristino leggero e upscaling moderato
- [ ] Fedeltà al volto: non modificare identità, età, espressione, tratti o creare dettagli inesistenti come fatti
- [ ] Conservare sempre originale; anteprima A/B e consenso esplicito «Usa versione migliorata»
- [ ] Pipeline asincrona/storage con quota e costo per immagine; limite dimensioni, formati e politiche di retention; non inviare originali a provider non autorizzati
- [ ] Prezzo e packaging da decidere (possibile **1 miglioramento incluso in Premium**, extra a consumo); definire costo reale prima del lancio
- [ ] Audit versione originale/elaborata e verifica legale/privacy su provider AI

## Post-MVP successivi
- [ ] Colorizzazione volontaria foto d'archivio e restauro avanzato, con etichetta di elaborazione
- [ ] Ritagli automatici per layout mobile, controllo manuale
- [ ] Video e commenti avanzati Premium, temi aggiuntivi
- [ ] Crowdfunding solo dopo gate provider/legal
- [ ] Analytics e multi-sede avanzati

## Definition of Done
Ogni voce ha una checklist di DB/migrazione, API e permessi, UI, test positivo/negativo, audit se richiesto, deploy Vercel READY e prova browser con dati reali di test.


## Aggiornamento 24/11 — Stato UI e galleria
Etichette user-friendly centralizzate per memoriali e contributi. DB invariato. Galleria Premium codice e RPC implementati, pubblicazione verificata solo a livello build/SQL parziale, non UAT manuale. Testiny FT-065..FT-070 aggiunti; 70 casi in TR-1 NOT RUN.


## Sprint 25/11/2026 — Galleria privata fino a pubblicazione
- [x] Bucket `memorial-gallery` convertito a privato (verificati 0 file preesistenti).
- [x] Policy Storage: accesso editor autorizzato in bozza; accesso anonimo solo se memoriale `PUBLISHED_ACTIVE`, copertura valida e foto associata.
- [x] Preview Famiglia e pagina visitatore utilizzano `storage.download` con autorizzazione, non URL public.
- [x] Build Vercel `READY` per codice privacy galleria.
- [ ] **Test browser** con immagine reale in UAT per verificare upload, anteprima editor, visitatore anonimo e scadenza; FT-071…075 tutti NOT RUN.
- [ ] Riconciliazione automatica file orfani e validazione completa lifecycle/gallery nel browser.


## Sprint 25/11/2026 — QR Code e link permanente
- [x] **QR per ogni memoriale**: identificativo casuale univoco a 128 bit, distinto dal token di pubblicazione, valorizzato anche sui memoriali preesistenti.
- [x] **Link stampabile**: `/r/[code]`, generabile prima di pubblicare, senza dati personali in bozza; dopo la pubblicazione reindirizza alla pagina del memoriale senza cambiare il QR.
- [x] **Compatibilità DEMO legacy**: QR di Giovanni Rossi → `/memoriale/demo`; Gino Fustellati resta in attesa.
- [x] **Download per stampa**: SVG vettoriale e PNG 1568×1568 con quiet zone di 4 moduli, senza provider QR esterni; integrato in Agenzia, Famiglia e contesti delegati.
- [x] **Test tecnici parziali**: 13 codici distinti verificati nel DB, resolver WAITING/PUBLISHED/LEGACY_DEMO verificato, generatore QR confrontato con riferimento indipendente, Vercel build READY.
- [ ] **UAT browser/scansione stampa** FT-076–084 (Testiny UAT-01): download, scansione QR reale, stato attesa, pubblicato, token ruotato, scadenza, privacy. Tutti NOT RUN.
- [ ] Formalizzare dominio canonico definitivo e mantenere un redirect permanente dal dominio impresso ai futuri indirizzi, per garantire validità fisica dei QR nel tempo.

**Hardening QR 25/11:** identificativo `qr_code` immutabile tramite trigger `trg_memorial_qr_immutable`, oltre all'indice univoco. Live HTTP verificato: QR Gino → pagina di attesa 200; QR demo Giovanni → demo pubblica 200; codice inesistente → 404. Nessuna scansione fisica PNG/SVG ancora eseguita.
