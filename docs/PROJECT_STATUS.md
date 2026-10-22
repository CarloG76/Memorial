# MEMORIAL — Registro operativo unico (fonte di avanzamento)

Aggiornato: 21 ottobre 2026, implementato provisioning amministrativo per nove identità e cambio password self-service (non ancora eseguito).
**Regola:** ogni attività deve avere ID stabile, stato, prova oggettiva, dipendenza e prossimo passo. Non confondere preparato, committato, in DB, verificato, rilasciato.
Stati: [x] provato sul sistema di destinazione; [~] parziale; [ ] da fare; [!] bloccato.
Le fonti business canoniche sono `01_DECISIONI.md`; questioni aperte `02_APERTI.md`.
Questo file governa il lavoro e va aggiornato nello stesso commit della relativa modifica. NON sostituisce la documentazione delle milestone.

## M0 — Base applicativa
- [x] M0-01 Repository Next.js/React/TS su GitHub. Prova: PR #1 e branch `m0-bootstrap`.
- [x] M0-02 CI ESLint, typecheck, Vitest, Playwright, build Next.js. Prova: run GitHub Actions 39465704854, success.
- [x] M0-03 Vercel Preview build READY. Prova: commit `f4f68b50`.
- [~] M0-04 Auth SSR nel codice; *nessun* login effettivo testato perché non è stato creato alcun utente.
- [ ] M0-05 Merge/abilitazione produzione con autorizzazione.

## M1 — Identità, tenancy, accessi
- [x] M1-01 Migrazioni app identity/agency onboarding presenti in Supabase. Verificato nel registro migrazioni: `m1_identity_tenancy`, `m1_agency_onboarding`, `m1_private_agency_registration_rpc` e hardening.
- [x] M1-02 Tabelle reali nel progetto Supabase: profiles, platform_memberships, agencies, agency_members, memorials, family_members, family_invites, agency_legal_documents, agency_registration_acceptances.
- [~] M1-03 Frontend autenticazione e verifica delle membership disponibili su PR #2; non collaudati con utenti reali.
- [~] M1-04 Provisioning SuperAdmin implementato in `scripts/provision-uat.mjs` per `gonella.carlo@gmail.com`; NON eseguito: manca chiave amministrativa in ambiente sicuro.
- [~] M1-05 Provisioning Auth Admin API implementato per 8 utenti demo, password da variabili d'ambiente non persistite; non eseguito. Matrice `docs/milestones/M2/UAT_ACCESS_MATRIX.md`.
- [~] M1-06 Il comando Auth provisioning implementa assegnazioni DB via client amministrativo; script SQL di backup `supabase/seeds/20261021_m2_bind_demo_auth_users.sql`. Non eseguito.
- [ ] M1-07 Eseguire test autorizzazioni cross-tenant con utenti veri e controlli RLS negativi.
- [ ] M1-08 Concludere onboarding agenzia e inviti famiglia E2E.

## M2 — Catalogo e demo persistente
- [x] M2-01 Migrazione catalogo demo applicata su Supabase: `is_demo` e vincoli coerenza agenzia/memoriale, campi tier/stato/visibilità.
- [x] M2-02 Seed persistente: 3 agenzie demo e 12 memoriali demo. Conteggi SQL verificati: 3/12; 0 mismatch, 0 record reali coinvolti al momento del test.
- [x] M2-03 Migrazione e seed versionati nel branch `m2-persisted-demo`.
- [~] M2-04 Console SuperAdmin: catalogo DB-backed, filtri e contatori committati; build CI e accesso OWNER ancora da verificare.
- [~] M2-05 Schermate Agenzia e Famiglia collegati alle membership Supabase e alle relative righe; codice committato, verifica login end-to-end mancante perché Auth non ha utenti.
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
- P-01: non ci sono utenti Auth in Supabase, né SuperAdmin né 8 demo (verificato SQL, 21/10/2026). Non trattarlo come una sorpresa: sono attività mancanti da svolgere.
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
- [ ] Esecuzione reale: necessita `SUPABASE_SECRET_KEY` da ambiente amministrativo, NON disponibile tramite connettore ChatGPT.
- [ ] Collaudo login U00–U08 e matrice ruoli cross-tenant: non possibile finché Auth ha 0 utenti.

## UAT 22/10/2026 — workflow operativo
- [x] Aggiunto al branch **main** `.github/workflows/provision-uat.yml` (commit `e15880a9`): workflow_dispatch con conferma esplicita, GitHub Secrets, checkout codice pin `cdb35944`, senza pubblicare password.
- [x] Aggiornato `scripts/provision-uat.mjs` per consentire unicamente l'esecuzione Actions approvata (oltre a host locale).
- [ ] Esecuzione manuale di `Memorial — crea account UAT (manuale)` via GitHub Actions. **Non ancora avviata** (il connettore GitHub disponibile non supporta workflow_dispatch).
- [ ] Conferma Supabase Auth: 9 utenti, 4 agency_members, 10 family_members, 1 platform OWNER.

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
