# MEMORIAL — Registro operativo unico (fonte di avanzamento)

Aggiornato: 21 ottobre 2026.
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
- [ ] M1-04 Creare/abilitare **account SuperAdmin reale**, senza credenziali in chat/repository e senza autoassegnazione pubblica. **BLOCCANTE per collaudo UI SuperAdmin.**
- [ ] M1-05 Creare gli 8 utenti demo Auth previsti in `11_DUMMY_GUIDA.md`; devono essere account separati da quelli reali, senza password nel codice.
- [ ] M1-06 Collegare utenti demo a membership e permessi corrette (agenzia, famiglia, ruoli), mantenendo `is_demo` coerente.
- [ ] M1-07 Eseguire test autorizzazioni cross-tenant con utenti veri e controlli RLS negativi.
- [ ] M1-08 Concludere onboarding agenzia e inviti famiglia E2E.

## M2 — Catalogo e demo persistente
- [x] M2-01 Migrazione catalogo demo applicata su Supabase: `is_demo` e vincoli coerenza agenzia/memoriale, campi tier/stato/visibilità.
- [x] M2-02 Seed persistente: 3 agenzie demo e 12 memoriali demo. Conteggi SQL verificati: 3/12; 0 mismatch, 0 record reali coinvolti al momento del test.
- [x] M2-03 Migrazione e seed versionati nel branch `m2-persisted-demo`.
- [~] M2-04 Console SuperAdmin catalogo DB-backed (codice nel branch). Build/CI e accesso reale da verificare.
- [ ] M2-05 Schermate Agenzia e Famiglia realmente operative sui record Supabase del rispettivo tenant.
- [ ] M2-06 Contenuti demo: biografie, ricordi, pensieri, moderazione, messaggi, ordini/test payment, conservazioni, notifiche e ticket come da `11_DUMMY_GUIDA.md`. Lo schema attuale è insufficiente; migrazioni da fare.
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
- P-06: per completare creazione Auth e bootstrap SuperAdmin servono flussi autorizzati e segreti gestiti dalla piattaforma, mai riportati in chat.
- P-07: schema prodotto incompleto; evitare di simulare workflow nel solo React.

## Prossima sequenza vincolante
1. Concludere build/CI e pubblicare M2 Preview.
2. Implementare creazione account SuperAdmin e 8 account demo con percorso sicuro di provisioning Auth.
3. Collegare membership e ruoli ai dati demo, senza usare account fittizi in `auth.users`.
4. Aggiungere tabelle contenuti/workflow e popolare in DB il dataset completo.
5. Collegare interfacce Agenzia/Famiglia/Visitatore al DB e renderle verificabili.
6. Implementare e collaudare Reset Dummy Data solo SuperAdmin.

**Politica di completamento:** chiudere una voce [x] solo con prova verificabile, salvata qui e nel report di milestone. Le verifiche non sostituiscono feature.
