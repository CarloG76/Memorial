# MEMORIAL — Registro operativo unico (fonte di avanzamento)

Aggiornato: 22 ottobre 2026, responsive obbligatorio per TUTTI i ruoli; account UAT provisionati.
**Regola:** ogni attività deve avere ID stabile, stato, prova oggettiva, dipendenza e prossimo passo. Non confondere preparato, committato, in DB, verificato, rilasciato.
Stati: [x] provato sul sistema di destinazione; [~] parziale; [ ] da fare; [!] bloccato.
Le fonti business canoniche sono `01_DECISIONI.md`; questioni aperte `02_APERTI.md`.
Questo file governa il lavoro e va aggiornato nello stesso commit della relativa modifica. NON sostituisce la documentazione delle milestone.

## M0 — Base applicativa
- [x] M0-01 Repository Next.js/React/TS su GitHub. Prova: PR #1 e branch `m0-bootstrap`.
- [x] M0-02 CI ESLint, typecheck, Vitest, Playwright, build Next.js. Prova: run GitHub Actions 39465704854, success.
- [x] M0-03 Vercel Preview build READY. Prova: commit `f4f68b50`.
- [~] M0-04 Auth SSR nel codice; 9 identità confermate in Supabase Auth. Collaudo end-to-end del login in ciascun viewport da completare.
- [ ] M0-05 Merge/abilitazione produzione con autorizzazione.

## M1 — Identità, tenancy, accessi
- [x] M1-01 Migrazioni app identity/agency onboarding presenti in Supabase. Verificato nel registro migrazioni: `m1_identity_tenancy`, `m1_agency_onboarding`, `m1_private_agency_registration_rpc` e hardening.
- [x] M1-02 Tabelle reali nel progetto Supabase: profiles, platform_memberships, agencies, agency_members, memorials, family_members, family_invites, agency_legal_documents, agency_registration_acceptances.
- [~] M1-03 Frontend autenticazione e verifica delle membership disponibili su PR #2; non collaudati con utenti reali.
- [x] M1-04 Account SuperAdmin creato e ruolo platform OWNER verificato nel DB il 22/10/2026.
- [x] M1-05 Otto account demo confermati Supabase Auth il 22/10/2026. Password in GitHub Secrets, non repository.
- [x] M1-06 Provisioning completato: 9 profili, 4 membership agenzia, 10 membership famiglia, 1 OWNER piattaforma (verificati via SQL).
- [ ] M1-07 Eseguire test autorizzazioni cross-tenant con utenti veri e controlli RLS negativi.
- [ ] M1-08 Concludere onboarding agenzia e inviti famiglia E2E.

## M2 — Catalogo e demo persistente
- [x] M2-01 Migrazione catalogo demo applicata su Supabase: `is_demo` e vincoli coerenza agenzia/memoriale, campi tier/stato/visibilità.
- [x] M2-02 Seed persistente: 3 agenzie demo e 12 memoriali demo. Conteggi SQL verificati: 3/12; 0 mismatch, 0 record reali coinvolti al momento del test.
- [x] M2-03 Migrazione e seed versionati nel branch `m2-persisted-demo`.
- [~] M2-04 Console SuperAdmin: catalogo DB-backed, filtri e contatori committati; build CI e accesso OWNER ancora da verificare.
- [~] M2-05 Schermate Agenzia e Famiglia collegate alle membership Supabase; ora Auth ha utenti, ma verifica end-to-end e UX completa da svolgere.
- [~] M2-06 Contenuti demo: migrazione PostgreSQL applicata per ricordi e pensieri; 2 ricordi, 2 pensieri (uno pending) verificati con query DB, tutti is_demo=true. UI Famiglia legge contenuti e stati dal DB; ancora da implementare scrittura/moderazione, biografie, messaggi privati, ordini, conservazioni, notifiche e ticket.
- [ ] M2-07 Escludere tutti i dati `is_demo=true` da KPI/billing reali in query/servizi e verificarlo.
- [ ] M2-08 Reset Dummy Data riservato SuperAdmin: atomico, ID stabili, tocca solo dataset demo e dipendenze demo; non implementato e non eseguibile.
- [ ] M2-09 Demo visitor (UNLISTED/PUBLIC, approvazioni), nessun mock frontend.
- [ ] M2-10 Test end-to-end demo delle quattro aree e responsive.

## Post-M2
- [ ] M3 Pagamenti Stripe TEST / webhook / crediti PRO.
- [ ] M4 Family authoring / media e pubblicazione approvata.
- [ ] M5 Visitor / moderazione / privacy e messaggistica.
- [ ] M6 Ricorrenze / staticizzazione.
- [ ] M7 Rinnovi e conservazione.
- [ ] M8 Dashboard/supporto/audit.
- [ ] M9 Fundraising solo con gate legale/provider.
- [ ] M10 Verifiche finali e release.

## Registro problemi e decisioni
- P-01: RISOLTO il 22/10/2026: 9 utenti Auth e relativi legami verificati. Rimane UAT funzionale e rotazione della password iniziale OWNER.
- P-02: il master richiede utenti demo e contenuti completi: le 3 agenzie + 12 memoriali attuali sono **solo parte** del dataset, non demo completata.
- P-03: il ramo `m2-interactive-demo` contiene esclusivamente un branch senza commit di dati hardcoded: non utilizzarlo come sorgente; mantenere **solo** `m2-persisted-demo`.
- P-04: le fonti chiedono reset permanente anche in produzione; la sicurezza del reset è ancora da verificare e il vecchio script non è applicabile ciecamente.
- P-05: l'app è divisa in PR stacked. Non dire che il codice è in produzione prima di un merge/release.
- P-06: per completare creazione Auth e bootstrap SuperAdmin servono flussi autorizzati e segreti gestiti dalla piattaforma, mai riportati in chat. Non creare utenti direttamente in auth.users via SQL; il master richiede Auth Admin/Dashboard.
- P-07: schema prodotto incompleto; evitare di simulare workflow nel solo React.

## Prossima sequenza vincolante
1. Concludere build/CI e pubblicare M2 Preview.
2. Implementare creazione account SuperAdmin e 8 account demo con percorso sicuro di provisioning Auth.
3. Collegare membership e ruoli ai dati demo, senza usare account fittizi in `auth.users`.
4. Aggiungere tabelle contenuti/workflow e popolare in DB il dataset completo.
5. Collegare interfacce Agenzia/Famiglia/Visitatore al DB e renderle verificabili.
6. Implementare e collaudare Reset Dummy Data solo SuperAdmin.

**Politica di completamento:** chiudere una voce [x] solo con prova verificabile, salvata qui e nel report di milestone. Le verifiche non sostituiscono feature.

## M2.1 — Provisioning Auth (21/10/2026)
- [x] Implementato script `scripts/provision-uat.mjs`: 9 identità, collision-check, marker demo, membership, controllo progetto, idempotenza, segreti solo da env.
- [x] Documentato `docs/milestones/M2/PROVISIONING.md`.
- [x] Pagina `/account/password` e server action autenticata per cambio password.
- [x] Esecuzione reale GitHub Actions manuale riuscita dopo ripristino dei GRANT service_role, Auth=9 e membership verificate via SQL.
- [ ] Collaudo login U00–U08 e matrice ruoli cross-tenant: utenti presenti, prove applicative ancora da eseguire.

## UAT 22/10/2026 — workflow operativo
- [x] Aggiunto al branch **main** `.github/workflows/provision-uat.yml` (commit `e15880a9`): workflow_dispatch con conferma esplicita, GitHub Secrets, checkout codice pin `cdb35944`, senza pubblicare password.
- [x] Aggiornato `scripts/provision-uat.mjs` per consentire unicamente l'esecuzione Actions approvata (oltre a host locale).
- [x] Esecuzione manuale di `Memorial — crea account UAT (manuale)` completata dall'utente il 22/10/2026; verifica SQL 9 utenti.
- [x] Conferma Supabase Auth: 9 utenti, 4 agency_members, 10 family_members, 1 platform OWNER, tutti email_confirmed=true.

## M2.2 — Cataloghi unificati e navigazione (22/10/2026)
- [x] DB: `profiles.catalog_demo_filter` con valori `ALL / ONLY_DEMO / NO_DEMO`, predefinito ALL e permesso UPDATE limitato alla colonna preferenza. Migrazione `unified_superadmin_catalog` applicata.
- [x] DB: RLS SELECT memoriali per OWNER piattaforma, senza aprire a tutti i ruoli.
- [~] UI: SuperAdmin elenchi unici Agenzie/Memoriali; colonna Demo per ogni record, filtro preferenza persistente in Supabase, ricerca, pagine dettaglio agenzia e memoriale. Implementati nel branch, collaudo UI ancora da effettuare.
- [ ] Provare con login reale la persistenza del filtro dopo logout/login e l'apertura dei dettagli di M01 e A01.
- [ ] Azioni di modifica nelle schede: non implementate, quindi non mostrarle come operative.
- [ ] Contenuti privati famiglie: gli accessi rimangono filtrati da RLS; le schede mostrano solamente ciò che è effettivamente autorizzato, da verificare.

## M2.3 — Allineamento mockup approvati (22/10/2026)
- [x] Confrontati `18_SUPERADMIN_A.jpg`, `19_SUPERADMIN_B.jpg` e `06_UI_DESIGN.md` con la UI reale.
- [~] Applicati sidebar navy, marchio, tab crema, cards KPI con accenti cromatici, toolbar, tavole dati chiare, tipografia editoriale, responsive; modifiche su `m2-persisted-demo`.
- [ ] Verifica rendering visivo reale desktop/mobile e test con login; non ancora svolti. Alcuni numeri/grafici dei mockup sono illustrativi e non vengono inventati nei KPI.
- [ ] Completare schermate mockup delle altre sezioni con dati effettivi e funzioni reali.

## M2.4 — Dashboard e Agenzie visibili dai mockup (22/10/2026)
- [~] Dashboard OWNER: KPI agenzie attive, memoriali pubblicati, Pro attive, conservati; pannelli panoramica agenzie, situazione memoriali, elementi che richiedono attenzione. Tutti i conteggi provengono dalle righe Supabase autorizzate e rispettano il filtro demo salvato.
- [~] Pagina Agenzie: KPI Totali, Pro attive, Free attive, inattive; elenco unico e accesso scheda con filtro demo. Nessun numero di crescita mensile inventato.
- [ ] Grafici ricavi, continuità economica, attività recenti e pagamento: non esistono ancora le necessarie tabelle/eventi. NON usare dati inventati; da implementare con schema e feed reali.
- [ ] Modifica agenzia e stati con audit: prossima milestone operativa.
- [ ] Login UAT e confronto browser desktop/mobile ai mockup prima della chiusura.

## M2.5 — Fix familiare e scheda Memoriale (22/10/2026)
- [x] DB verificato: M01 ha 2 family_members, 1 memoria, 2 pensieri; M02 ha 2 membri, 1 ricordo. Associazioni già presenti: bug era RLS read.
- [x] Migrazione `superadmin_family_content_read` applicata: accesso SELECT ai tre ambiti per solo OWNER della piattaforma; nessun UPDATE o accesso anon.
- [~] UI dettaglio: familiari per nome da profiles, card icone colorate, date localizzate, ricordi e pensieri. Pubblicata sul branch M2, attende verifica reale sessione e build.
- [ ] Sezioni Economia, Statistiche e Assistenza secondo i mockup necessitano ancora sorgenti dati e flussi effettivi, non inventare KPI.

## M2.6 — Modern Premium SaaS (22/10/2026)
- [x] Introdotto componente SVG riusabile `src/components/ui-icon.tsx` con icone vettoriali coerenti senza font esterni o pacchetti non versionati.
- [~] Sidebar, toolbar, KPI, filtri, tabelle, card e responsive adattati al linguaggio moderno dei riferimenti utente, preservando navy/gold e gerarchia dei mockup Memorial. Commit `89b01dc3`.
- [ ] Preview visuale desktop/mobile da collaudare effettivamente. Nessuna feature di ricerca globale, notifiche o grafici economici viene dichiarata completata sulla sola base dell'aspetto.
- [ ] Flussi operativi SuperAdmin Agenzie e altre sezioni da sviluppare con persistenza DB e audit.

## M2.7 — Requisito responsive universale, 22/10/2026
**Decisione utente vincolante:** progettare, realizzare e collaudare simultaneamente desktop/tablet/smartphone per OGNI feature e OGNI ruolo (SuperAdmin, Agenzia, Famiglia, Visitatore). Non considerare mai mobile/tablet come una milestone separata.
- [x] Documento permanente di accettazione: `docs/RESPONSIVE_STANDARD.md`.
- [~] Shell responsive riusabile sviluppata: drawer hamburger per tablet/mobile con overlay, Esc, focus trap, ripristino focus e navigazione per tre ruoli. Codice in `src/components/workspace-chrome.tsx`.
- [~] Tabelle delle aree già sviluppate con card responsive ed etichette per schermate strette; KPI e filtri adattati via CSS.
- [~] Playwright aggiunto formato tablet da 834 px e spec `e2e/responsive-contract.spec.ts` per verifiche responsive. CI ed E2E autenticati ancora da completare.
- [ ] Test su browser reale di menu, filtri, responsive delle pagine Agenzia/Famiglia e assenza overflow a 360, 390, 768, 834, 1024, 1440 px.
- [ ] Ogni prossima PR deve superare il gate mobile/tablet/desktop **prima** di chiudere la funzionalità.

## UX — Audit e contratto componenti obbligatorio (22/10/2026)
- [x] Analisi cross-role documentata in `docs/COMPONENT_USAGE_AUDIT.md`: 18 classi di componenti, matrice 7 schermate SuperAdmin, 5 Agenzia, 7 Famiglia, contesto Visitatore, specifiche desktop/tablet/mobile, ACL/dati/empty/error/action/test.
- [x] Dalla verifica codice individuati: search topbar fittizia, simboli e badge incoerenti, etichette 12px, KPI scalati da query `select all`, duplicazione rendering tabelle/cards, alcune sezioni solo placeholder.
- [x] Prima correzione eseguita: link toolbar ora esplicita “Apri elenco agenzie” o “Vai alla panoramica”, senza simulare ricerca globale. Commit `48b840bf`.
- [x] PR template `.github/PULL_REQUEST_TEMPLATE.md` con gate componenti, dati, ruoli, Desktop/Tablet/Smartphone, accessibilità, screenshot e UAT.
- [ ] Refactoring UI verso `RecordList`, `StatusBadge`, `KpiStat`, `SearchFilter`, `StateBoundary` condivisi.
- [ ] Audit e correzione tipi e contrasti su tutti i breakpoint, WCAG AA e screen reader.
- [ ] Esecuzione E2E autenticato e screenshot diff per ciascun ruolo; design gate non ancora chiuso.

## M3.1 — Demo pubblica Premium per visitatori (27/10/2026)
- [x] Pagina pubblica `/memoriale/demo` pubblicata su `main`, con layout desktop/mobile, ritratto illustrativo generato, biografia, timeline, ricordi Premium e pensieri approvati.
- [x] RPC `get_public_memorial_demo()` con SELECT anon verificata: M01 sintetico PUBLIC/PUBLISHED_ACTIVE soltanto; 1 ricordo e 1 pensiero APPROVED; contenuto PENDING escluso; nessun ID, token, recapito o messaggio privato restituito. Tabella del racconto demo senza GRANT anon SELECT.
- [x] CTA visive: Lascia un pensiero, Proponi un ricordo, Scrivi ai suoi cari, Rimani in contatto e Condividi. In questa fase tutte le submission sono demo senza chiamate API né persistenza.
- [x] Contatti demo: email facoltativa, tre opt-in indipendenti e non preselezionati, nota verifica email e revoca; non salvataggio di email, consensi, pensieri o messaggi.
- [ ] Collegamento funzionale/moderazione/recapiti cifrati/OTP e PIN non ancora sviluppato. Niente fondi finché provider non approvato.
- [ ] Collaudo visivo reale su browser e verifica del JPEG nell'ambiente di produzione da completare: build READY non è test end-to-end.

## M3.2 — Memoriale pubblico e SuperAdmin: asset, database, audit (28/10/2026)
- [x] Nuovo ritratto virtuale di Giovanni, generato e ottimizzato, salvato come file binario Git su `main`: `public/images/giovanni-hero-2026.webp` (SHA blob verificato `2e4c70e9acce80ecd05f84db33029b72b061eec1`).
- [x] Ritratto, fuoco orizzontale e sfondo pubblico caricati dalla proiezione **Supabase**, non codificati nel componente visitatore. Media importati nel DB con evento distinto dalla sessione di un operatore.
- [x] Sfondi Montagna, Prato, Mare, Lago, Bosco, Collina, Cielo in `memorial_background_presets` con dati e URL modificabili da database; area Famiglia legge catalogo e ritratto del proprio memoriale con permesso RLS.
- [x] Memoriale demo identificato tramite `memorial_demo_slots`, proiezione pubblica resa solo per memoriale PUBLIC/PUBLISHED_ACTIVE, esclude pensieri/ricordi non APPROVED e dati privati.
- [x] SuperAdmin → Memoriali → dettaglio → **Modifica memoriale**: nome, dedica, biografia, foto e fuoco, override sfondo pubblicato, CRUD foto galleria, CRUD e moderazione di ricordi e pensieri. Tutte queste operazioni richiedono ruolo OWNER e motivazione, con audit prima/dopo; modifica DEMO consentita.
- [x] Registro piattaforma `platform_change_log`: trigger sui 12 registri principali, actor, DEMO, prima/dopo, timestamp, consultazione SuperAdmin con paginazione in `Impostazioni`. **Cattura solo i cambiamenti successivi all'installazione**, non retroattivi.
- [x] Test SQL in transazione con rollback: owner può modificare pubblicazione, galleria e contributi; il pubblico vede solo approvati; test senza mutare il dataset.
- [x] GitHub CI, inclusi lint/typecheck/test/build e job RLS, **SUCCESS** sul commit `e3ddae70`. Vercel Git → `main` produce deploy production.

**Ancora da implementare:** upload privato persistente e pubblicazione dei media personalizzati dalla Famiglia (attualmente solo anteprima locale); verifica email e invio reale degli interventi visitatore; CRUD SuperAdmin per tutte le altre feature oltre ai memoriali; permessi per STAFF Admin/Customer Care; percorso Standard/Premium completo e E2E autenticati; collaudo visivo browser reale.
