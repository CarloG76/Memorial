# Memorial — Audit dei componenti e contratto d'uso UX/UI v1

**Data:** 22/10/2026. **Ambito:** intero prodotto — SuperAdmin, Agenzia, Famiglia, Visitatore; desktop, tablet e smartphone.  
**Scopo:** decidere *quando usare*, *come comportarsi*, *come adattare*, *come autorizzare* e *come testare* ciascun componente. Un semplice cambio di CSS non equivale a completare una UX.

## 1. Gerarchia e natura delle indicazioni

**Specifiche approvate:** `01_DECISIONI.md` prevale; `03_PRODOTTO.md`, `05_RUOLI_PERMESSI.md`, `06_UI_DESIGN.md`, `07_WORKFLOW.md`, `12_TEST_ROADMAP.md` sono la base per i flussi; i mockup forniti sono riferimenti di *struttura visiva*, non simulazioni da importare come schermate funzionanti.

**Decisioni vincolanti:**
1. Responsive *per ogni feature e ruolo*, non milestone posticipata. Desktop, tablet, mobile contemporaneamente.
2. Database Supabase è la fonte di verità di dati, ruoli, contenuti, preferenze persistenti e audit. Nessun array mock in UI reale.
3. L'agenzia è cliente B2B e non modifica i contenuti familiari; la Famiglia gestisce contenuti e moderazione ma non riceve pricing; Visitatore senza registrazione obbligatoria.
4. SuperAdmin governa la piattaforma; accesso eccezionale ai dati più privati è motivato, temporaneo e auditato, non navigazione indiscriminata. Le verifiche RLS sono obbligatorie.
5. `is_demo` distingue fixture persistenti; il filtro visuale non sostituisce l'esclusione dei demo da fatturazione e KPI reali. Gli account demo non inviano email/pagamenti reali.
6. Solo i dati resi disponibili dai servizi reali possono apparire come KPI o trend. I mockup non autorizzano ricavi, incrementi o ticket inventati.

**Proposte di implementazione UX (non nuove decisioni business):** sotto definite e da usare nel codice. Limiti media, provider, prezzi, ciclo di vita e azioni straordinarie restano regolati dai documenti canonici.

## 2. Breakpoint e densità: *cambia la struttura, non sparisce il contenuto*

| Formato | Larghezza di collaudo | Navigazione | KPI | Elenchi e dettagli |
|---|---|---|---|---|
| Smartphone piccolo | 320–375 px | Hamburger + drawer; header 1 riga | 1–2 colonne se ogni card conserva leggibilità | Una card per record; etichette esplicite, azione primaria a larghezza utile |
| Smartphone standard | 390–430 px | Hamburger + drawer | 2 colonne quando il valore non si tronca | Cards; filtri impilati/pannello |
| Tablet verticale | 768–834 px | Hamburger + drawer | 2 colonne, 3 se leggibile | 1–2 cards per riga o tabella ridotta se non perde funzioni |
| Tablet orizzontale | 1024 px | Drawer o sidebar secondo spazio effettivo | 2–4 colonne | Preferire tabella solo se colonne, target e azioni restano leggibili |
| Desktop | 1280–1440+ px | Sidebar permanente | Fino a 4 KPI per riga | Tabella completa, pannelli affiancati |

I breakpoint 760/1100 px già adottati sono **soglie iniziali, non garanzia**: far prevalere la larghezza e la leggibilità del contenuto. Testare anche zoom al 200%, riduzione movimento e rotazione schermo. Altezza touch target consigliata almeno 44 px. Il contratto `06_UI_DESIGN.md` specifica *body >=16 px, label >=14 px*: eventuali 12 px nel codice attuale sono difetti.

## 3. Contratti per componente: responsabilità, sorgenti, interazioni, responsive

### C01 — AppShell / WorkspaceChrome / SidebarNav
- **Quando:** tutte le pagine autenticate; non applicare forzatamente il backoffice al visitatore pubblico.
- **Dati:** area e membership verificate dal server, menu autorizzato; route corrente dal router.
- **Desktop:** sidebar ~240 px, toolbar e breadcrumb contestuale; una sola voce `aria-current=page`.
- **Tablet/mobile:** pulsante hamburger con `aria-expanded`, drawer sovrapposto, X, click sull'overlay, Esc, focus nel drawer, scroll pagina bloccato, ripristino del focus. Mostrare solo azioni realmente disponibili e segnalare in modo esplicito quelle in costruzione.
- **Non fare:** cancellare il menu con `display:none` senza alternativa; link non funzionanti; un pulsante o una ricerca che portano in luogo diverso dall'etichetta.
- **Verifica:** E2E autenticato per OWNER, Agency e Family a 390/834/1024/1440; navigazione tastiera e screen reader, ritorno focus dopo Esc.

### C02 — TopBar / GlobalSearch / AccountMenu / Notifications
- **Quando:** console operative. Ricerca globale solo con query reale e risultati con permessi RLS.
- **Dati:** sessione, nome e ruolo letti da Auth/profiles; contatore notifiche da servizio notifiche, se esiste.
- **Desktop:** ricerca estesa, profilo e azioni sessione. **Mobile:** icona ricerca apre campo/modale dedicato con focus, chiusura e risultati; account menu accessibile.
- **Non fare:** visualizzare ricerca come collegamento a `/agenzie`; campanella fittizia che sembra cliccabile; profilo anonimo `SA` se è disponibile il nome reale.
- **Stato attuale:** `WorkspaceChrome` usa ancora un link a pagina Agenzie come pseudo-ricerca. **P1 da correggere prima di definire concluso il topbar.**

### C03 — PageHeader / Breadcrumb / PrimaryCTA
- **Quando:** ogni elenco e dettaglio.
- **Dati:** titolo, scope di ruolo e stato corrente; CTA solo se permesso/capability e backend effettivamente implementati.
- **Desktop:** titolo, sottotitolo, azioni a destra. **Mobile:** titolo su 1–2 righe, azione principale accessibile sotto il titolo o in una barra contestuale.
- **Non fare:** link `Nuova agenzia / Nuovo memoriale` decorativi; non mostrare l'UUID come titolo importante. Su un record privato evitare link pubblico non autorizzato.

### C04 — KPIStat / MetricCard
- **Quando:** dashboard o overview con almeno un dato decisionale (conteggio, importo, stato, alert). Max 4 top-card, non 8 per riempire spazio.
- **Dati:** funzione SQL/servizio aggregato lato server, timestamp aggiornamento, scope (reale/demo), unità e periodo.
- **Trend:** mostrare +/−% *solo con due periodi completi e confrontabili e denominatore valido*. Diversamente mostrare “Confronto non disponibile”.
- **Responsive:** numero intero e unità mai tagliati; 4 desktop, 2 tablet, 1–2 mobile. Icona vettoriale coerente con semantica (non carattere Unicode casuale).
- **Non fare:** calcolare tutti i KPI scaricando tutte le righe del DB in produzione; tenere demo nei ricavi; usare colori senza testo.
- **Stato attuale:** conteggi derivati da intere liste Supabase e gradient/card con icone testuali: corretti per fixture piccole, **non ancora scalabili**.

### C05 — ChartCard / LineChart / BarChart / Donut / Funnel / Cohort
- **Quando:** solo se una serie temporale, distribuzione o confronto aggiunge informazione rispetto a un numero.
- **Dati:** endpoint/aggregazione tipizzata con bucket temporali, definizione della metrica, periodo e timezone; periodo non confondere con data di inserimento.
- **Layout:** desktop chart ampio; tablet larghezza intera; mobile semplificare tick/legenda, dare tooltip accessibili via tap e riepilogo testuale/tabellare equivalente.
- **Empty:** “Dati insufficienti per il periodo” + criterio; mai grafico costruito da numeri illustrativi dei mockup.
- **Accessibilità:** titolo, unità, descrizione e alternativa tabellare; non solo codici colore.
- **Stato attuale:** le tabelle storiche ricavi/ticket non sono state implementate; quindi i grafici dei mockup di Economia/Statistiche non sono ancora funzioni operative.

### C06 — DataTable / RecordList / MobileRecordCard
- **Quando:** elenco di record con ordinamento, ricerca, filtri, paginazione, azioni.
- **Dati:** query RLS filtrata, ordinamento stabile, `id` come chiave, totale compatibile coi permessi, paginazione lato server per volumi reali.
- **Desktop:** tabella semantica con intestazioni, colonne scelte per compito; sticky header se la tabella è lunga, azioni contestuali accessibili.
- **Tablet:** tabella semplificata solo se le colonne sono ancora interpretabili, altrimenti cards con etichette e azioni equivalenti.
- **Smartphone:** cards a colonna singola; nome/stato/azione sempre visibili; info secondarie in righe etichettate; pulsante “Apri dettagli” con area touch >=44 px. **Non perdere ordinamento, filtri o paginazione** nel passaggio tabella→card.
- **Non fare:** overflow orizzontale forzato per dati ordinari; `td::before` senza `data-label`, perché produrrebbe campi senza intestazione.
- **Stato attuale:** in `demo-catalog.tsx`, `tenant-workspaces.tsx` e dettagli sono stati aggiunti `data-label`; manca un componente centralizzato che impedisca omissioni. **P1: unificare DataTable/RecordCard.**

### C07 — SearchFilter / FilterDrawer / SavedPreference
- **Quando:** liste Agenzie, Memoriali, ticket, ricordi, pagamenti.
- **Dati:** ricerca e filtri effimeri nell'URL; **solo preferenze esplicitamente persistenti** nel profilo DB, come `profiles.catalog_demo_filter`.
- **Desktop:** campi in riga; tablet: 2 righe se necessario; mobile: ricerca sempre accessibile, pulsante “Filtri” apre pannello; mostra numero filtri attivi, “Azzera filtri” e “Applica”.
- **Preservare:** ritorno da dettaglio con filtri/ordinamento, focus sul contenuto aggiornato, stato durante caricamento.
- **Non fare:** memorizzare criteri riservati in localStorage; filtro demo applicato solo alla vista mentre i KPI reali lo ignorano; `NO_DEMO` che comprende demo nei contatori.
- **Stato attuale:** filtro demo persistito correttamente su DB, ma il resto dei filtri mockup non è implementato.

### C08 — StatusBadge / TierBadge / DemoFlag
- **Quando:** qualsiasi stato che orienta un'azione.
- **Dati:** enum lato server, mapping centralizzato label/testo/tono; definizioni distinte per Agenzia `ACTIVE,SUSPENDED,CLOSED`, Memoriale lifecycle, moderazione `PENDING,APPROVED,REJECTED`, pagamenti e ticket quando esistono.
- **Responsive:** pill leggibile, non sostituire testo con solo colore; non ridurre a puntino.
- **Non fare:** mostrare `PUBLISHED_ACTIVE` o `PAYMENT_PENDING` non tradotti nella scheda; usare “pubblicato” per `PRESERVED_STATIC`; confondere `is_demo` con tier.
- **Stato attuale:** badge e traduzioni duplicati in più file, alcuni dettagli mostrano raw enum. **P1: un solo `StatusBadge`.**

### C09 — DetailHeader / DetailSections / RecordActivity
- **Quando:** Agenzia, Memoriale, ticket, transazione, family editor.
- **Dati:** record reale autorizzato e relazioni; dati caricati da server; 404/403/failure distinti.
- **Desktop:** overview + sezioni affiancabili; tablet: griglia 2 colonne se spaziosa; mobile: sezioni verticali, dettagli importanti in alto.
- **Mostrare:** nome, stato leggibile, contesto, azioni autorizzate, cronologia/audit quando esistono. UUID in dettagli tecnici copiabili, non protagonista visivo.
- **Non fare:** considerare la scheda “operativa” solo perché elenca dati; edit e stato richiedono mutation, validazione, transazione e audit.

### C10 — FormField / Select / DateInput / Stepper / SaveBar
- **Quando:** modifica anagrafica, creazione skeleton, profilo/storia, impostazioni.
- **Dati:** valori iniziali DB, permessi verificati nel server action/RPC, validazioni client + server, errori campo e globali.
- **Responsive:** una colonna smartphone, 2 colonne dove appropriato tablet/desktop; campi touch >=44 px, font input >=16 px; CTA salvare/annullare accessibili senza zoom.
- **Stati:** dirty, invio in corso, salvataggio, errore, conflitto/concorrenza; impedire doppie submission.
- **Non fare:** alterare `is_demo`, ruoli o prezzi con un campo non autorizzato; aggiornare il DB senza audit per cambi critici.

### C11 — ConfirmDialog / DestructiveAction
- **Quando:** sospensione agenzia, cambio visibilità pubblica, cambio family owner, cancellazione, reset dummy, refund.
- **Dati:** contesto e impatto verificati, motivazione se richiesta, audit e controllo server.
- **Responsive:** dialog desktop, sheet mobile con testo leggibile, focus trap, annulla chiaro, nessun default distruttivo.
- **Non fare:** conferma soltanto in JS/HTML e bypass possibile dalla API; cambi business immediati se vigono regole di periodo (es. Free→Pro dal mese successivo).

### C12 — Toast / InlineAlert / EmptyState / LoadingSkeleton / ErrorBoundary
- **Quando:** per ogni query e mutazione.
- **Stati minimi:** loading, empty, success, validation error, network error, denied, retry quando sicuro.
- **Responsive:** toast visibile senza coprire CTA o navigazione; errori accanto al campo e riassunto; annunci aria-live appropriati.
- **Non fare:** mostrare “Nessun record” quando query ha ricevuto 403/500. L'app attuale in parte lancia errori server: predisporre pagine d'errore utilizzabili.

### C13 — FamilyModerationQueue / ThoughtComposer / MemoryCard
- **Quando:** Famiglia: moderazione e contenuti; Visitatore: proposte e pensieri.
- **Dati:** tabella DB scoped a `memorial_id`, capability `can_moderate` sul server, moderazione persistente; `PENDING` invisibile al pubblico.
- **Desktop:** elenco con stato e dettaglio; mobile: cards singole con azioni approva/rifiuta separate, non incollate, conferma se necessario.
- **Non fare:** pubblicare immediatamente dopo submission; salvare in localStorage; consentire all'agenzia di editare la storia.

### C14 — FileUpload / MediaGallery
- **Quando:** Family editor, proposte visitatore Premium e avatar/copertina secondo piano.
- **Dati:** Storage privato, URL firmati a scadenza, controlli MIME/size, moderazione, antivirus secondo fase; limiti media da decisione business prima dello sviluppo definitivo.
- **Responsive:** upload da fotocamera/galleria con progresso e riprova; immagini responsive con dimensioni, video senza autoplay; dettagli accessibili e alt.
- **Non fare:** lasciare media privati su bucket pubblico; copia di URL firmati in pagina indicizzabile.

### C15 — PreviewPublish / VisibilityControl / ShareModal
- **Quando:** Famiglia, workflow di pubblicazione, QR e visitor.
- **Dati:** versione immutabile in anteprima; pubblicazione solo dopo conferma familiare; `PUBLIC` esplicitamente autorizzato, `UNLISTED` default, PIN opzionale.
- **Responsive:** preview con switch mobile/desktop, ma i contenuti non si basano su user-agent; dialog/modale touch.
- **Non fare:** confondere skeleton pagato con memoriale pubblicato; QR contenente nome semanticamente enumerabile.

### C16 — PaymentSummary / FinanceCard / TransactionList
- **Quando:** Agenzia e SuperAdmin Economia, mai nella Famiglia/Visitatore; donazioni sono flusso separato da ricavi Memorial.
- **Dati:** ledger/ordini/fatture verificati server, importi/currency, transazioni provider, riconciliazione; demo esclusi dai totali economici reali.
- **Responsive:** importi leggibili, ricerca e riconciliazione contestuali, conferma azioni forti.
- **Non fare:** usare i € dei mockup, attivare denaro reale o crowdfunding senza gate/provider.

### C17 — SupportTicketList / TicketConversation / IncidentSLA
- **Quando:** SuperAdmin/Support; Agenzia con sola propria richiesta.
- **Dati:** ticket, commenti, assegnazioni e SLA reali con ACL separati dai memoriali privati; risposta e chiusura auditata.
- **Mobile:** lista→dettaglio full-screen; conversazione con input accessibile sopra la tastiera; pulsanti rispondi/chiudi distinti.
- **Non fare:** pannello pieno di ticket sintetici non presenti a DB o testo privato senza motivazione/permessi.

### C18 — AnniversarySettings / PreservationTimeline
- **Quando:** Famiglia ricorrenze e Agenzia conservazione, con differenti autorizzazioni.
- **Dati:** opzioni compleanno/scomparsa/entrambi, finestra 7 gg, annualità, scadenza, opt-out e stato conservazione.
- **Mobile:** calendario in colonna, spiegazione finestre; non inserire prezzi nell'area Famiglia.
- **Non fare:** estendere o ridurre scadenze sulla sola UI.

## 4. Composizione delle schermate per ruolo

Questa matrice **non** dichiara le funzioni già completate; descrive l'architettura prevista.

| Area | Schermata | Componenti principali | Dati / vincoli |
|---|---|---|---|
| SuperAdmin | Dashboard | C01–05 + alert/activity (C12) | Aggregati reali con periodi; distinzione demo/real |
| SuperAdmin | Agenzie | C03, C04, C06–12 | Lista unica, demo flag, membri, piano, stato, storico e azioni audit |
| SuperAdmin | Memoriali | C03, C04, C06–09, C18 | Lifecycle, famiglia, segnalazioni, conservazione; dati privati sotto disciplina |
| SuperAdmin | Economia | C04–07, C08, C16 | Ricavi, fatture, riserva: fonti contabili reali |
| SuperAdmin | Statistiche | C04–05, C07 | Commerciale/Prodotto/Economia unitaria; filtri periodo comparabili |
| SuperAdmin | Assistenza | C04, C06–12, C17 | Ticket, conversazioni, incidenti, SLA |
| SuperAdmin | Impostazioni | C03, C09–12 | Ruoli, listini, audit, reset fixture protetto |
| Agenzia | Dashboard | C01–04, C12, C18 | KPI propri, scadenze e skeleton in lavorazione |
| Agenzia | Memoriali | C03, C06–12, C18 | Elenco, creazione wizard, inviti, rinnovi |
| Agenzia | Statistiche | C04–07 | Base Free / analisi avanzate Pro |
| Agenzia | Amministrazione | C06–12, C16 | Canone, crediti, fatture B2B |
| Agenzia | La mia agenzia | C03, C09–12 | Dati, operatori, sedi e branding secondo piano |
| Famiglia | Panoramica | C03–04, C09, C12 | Stato pubblicazione e pensieri da approvare |
| Famiglia | Profilo e storia | C09–12, C14–15 | Biografia, media, preview e publish |
| Famiglia | Ricordi | C06–09, C13–14 | Rich media solo Premium, moderazione |
| Famiglia | Pensieri e commenti | C06–09, C13 | Queue PENDING e privati su ACL corretta |
| Famiglia | Famiglia e contatti | C06–12 | Membri, deleghe, consensi distinti |
| Famiglia | Anniversari e solidarietà | C10–12, C18 | Ricorrenze e fundraiser solo se provider abilitato |
| Famiglia | Impostazioni | C09–12, C15 | Visibilità/PIN/QR/export/durata |
| Visitatore | Home, storia, ricordi, pensieri | C03, C09, C13–15 | Solo proiezione pubblica approvata |
| Visitatore | Scrivi ai cari, contatti, condivisione | C10–15 | Modali contestuali, dati facoltativi e verificati |
| Visitatore | Opere di bene | C16 adattato al provider | Solo se attiva, donazioni non ricavi Memorial |

## 5. Audit concreto sul codice presente al 22/10/2026

| Priorità | Evidenza tecnica | Problema / impatto | Azione correttiva e test |
|---|---|---|---|
| P0 | `src/components/workspace-chrome.tsx` | Topbar “Esplora i contenuti…” è link verso Agenzie, non ricerca. Affordance ingannevole | Sostituire con pulsante chiaramente etichettato “Apri elenco” oppure implementare ricerca reale per ruolo; test navigazione |
| P0 | `src/components/workspace-chrome.tsx` | Solo le prime aree di ogni ruolo hanno link reali; le altre sono disabilitate. Non esiste ancora la gestione completa | Non simulare disponibilità; mantenere gate e costruire i flussi per priorità business |
| P1 | `src/app/globals.css` | Diverse regole legacy e override stratificati, 12px nei filtri/card | Consolidare tokens/css modules e controllare contrasto, dimensione testo e precedenza; screenshot diff |
| P1 | `src/components/demo-catalog.tsx` | Lista globale usa tutte le righe lette per calcolare KPI | Introdurre aggregazioni DB/filter-aware + paginazione prima di volumi reali; test filtro demo/real |
| P1 | `demo-catalog.tsx`, `tenant-workspaces.tsx`, dettagli | Labels responsive aggiunti manualmente | Componenti DataTable+RecordCard condivisi e type-safe, parity di colonne/actions nei formati |
| P1 | `src/app/console/piattaforma/memoriali/[id]/page.tsx` | Enum/stati in inglese tecnico nelle schede | Badge mapping centralizzato, traduzione e tono semantico |
| P1 | `playwright.config.ts`, `e2e/responsive-contract.spec.ts` | Progetti desktop/tablet/mobile definiti; parte autenticata condizionata a credenziali UAT | CI separata UAT protetta, eseguire e allegare risultati. Build READY non è test UX |
| P1 | `workspace-chrome.tsx` | Drawer usa focus trap, body scroll-lock; da verificare resize/apertura/rotazione e VoiceOver | E2E focus, Esc, tap outside, navigazione dopo tap, cambio viewport, mobile Safari reale |
| P2 | Homepage/accesso | Responsive verificato solo con aspettative preliminari E2E | Audit completo public/visitor su 320–1440; form error e safe area |
| P2 | Economia/Statistiche/Assistenza | Non esistono ancora i flussi/dataset completi | Implementare prima schema/eventi/permission e poi i componenti mockup |

**Non risultano prove qui di test visuale effettivo desktop/tablet/mobile, né di E2E cross-role completi.** Non contrassegnare queste voci come completate.

## 6. Interfacce consigliate per i componenti di base

I seguenti *contratti di progetto* devono guidare l'implementazione (non sono codice dichiarato già esistente):
- `<KpiStat label value unit trend? period? asOf? tone? href?>`: trend solo se confrontabile, valore accessibile.
- `<RecordList rows columns mobileFields actions pagination sorting?>`: vista tabella o cards **paritarie** per contenuto/azioni.
- `<StatusBadge domain value>`: domain esplicito (agency/memorial/moderation/payment/ticket), mappa univoca.
- `<SearchFilter schema value onApply onClear persistedKeys?>`: validazione e serializzazione condivisa.
- `<DetailHeader title subtitle status breadcrumbs actions?>`: niente azioni se API non pronta.
- `<ConfirmAction title impact reasonRequired? onConfirm>`: conferma e audit server, non solo UI.
- `<ChartCard series unit granularity emptyState tableAlternative>`: niente serie finte.
- `<StateBoundary loading empty error success forbidden>`: distingue lista vuota da query fallita.
- `<ResponsiveForm fields onSubmit validation>`: uso di form semantico, focus errori e prevenzione doppio invio.

## 7. Test contrattuali e Definition of Done obbligatoria

**Per ogni pagina o modifica di componente:**
1. Verificare visualizzazione 320/360/390/768/834/1024/1440 px; zoom 200%; portrait/landscape.
2. Assenza di scroll orizzontale dell'intera pagina. Le parti che contengono dati non spariscono per `display:none`.
3. Desktop/tabella e mobile/cards mostrano stesse informazioni indispensabili, azioni e scope autorizzato.
4. Touch target >=44×44 px; label >=14 px; input >=16 px; focus visibile, Esc e tab order.
5. RLS: owner/agency/family/anon per query/azioni; test negativi cross tenant; gating privato.
6. Stati loading/empty/error/unauthorized/success. Non confondere un errore DB con “nessun risultato”.
7. Dati reali: filtro `is_demo`, aggregati, date localizzate, timezone e rounding corretti.
8. Tutte le operazioni pericolose passano da server-side authorization, controllo workflow, transazione e audit.
9. Playwright per journey critici su almeno desktop, tablet, mobile; per release effettuare prova manuale su Safari iOS e Chrome Android. Allegare screenshot e test result alla PR.
10. Chiusura solo se build, test, Preview e verifica umana comprovati, con rollback e `docs/PROJECT_STATUS.md` aggiornati.

### Ordine di intervento approvato in questa analisi
**Prima** rimuovere affordance false, rendere stabile la shell sui 3 formati e creare `StatusBadge` / `RecordList` condivisi. **Poi** rendere operativa la scheda Agenzia con form e audit. **Infine**, per ogni nuova pagina del prodotto, comporre componenti tipizzati invece di duplicare CSS o nascondere funzionalità su mobile.

---

**Perimetro di questa consegna:** documento d'analisi e accettazione; non certifica l'avvenuto refactoring di tutti i componenti elencati. Ogni realizzazione verrà registrata separatamente con commit e prove.
