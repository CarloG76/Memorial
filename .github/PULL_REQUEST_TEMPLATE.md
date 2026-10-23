## Scopo e fonte
- Schermate / flussi coinvolti:
- Specifiche: `01_DECISIONI.md`, `05_RUOLI_PERMESSI.md`, `06_UI_DESIGN.md`, `docs/COMPONENT_USAGE_AUDIT.md`
- Riferimenti mockup (file e schermata):
- Componenti condivisi riutilizzati; nuove varianti motivate:

## Dati, autorizzazioni e privacy
- [ ] Tutte le informazioni persistenti da Supabase; niente fixture TypeScript per prodotto
- [ ] Query e mutazioni con RLS e ruoli verificati lato server
- [ ] `is_demo` preservato e escluso da reporting/fatturazione reali
- [ ] Dati privati, contatti e messaggi soggetti al corretto ambito e audit
- [ ] Nessun pagamento/email reale nei test demo

## UI / Componenti
- [ ] Informazioni e azioni prioritizzate secondo il compito, non solo secondo il mockup
- [ ] Icone, status, card, filtri e list-detail riusano i componenti canonici
- [ ] Desktop e mobile offrono le stesse azioni e le informazioni indispensabili
- [ ] Ricerca, notifica, pulsante e link funzionano davvero: no pseudo-funzionalità
- [ ] Caricamento, vuoto, errore, vietato, successo progettati e testati
- [ ] Nessun KPI/trend/grafico inventato

## Gate responsive e accessibilità — OBBLIGATORIO IN OGNI PR
- [ ] Desktop >=1280 px screenshot e verifica
- [ ] Tablet 768/834/1024 px screenshot e verifica
- [ ] Mobile 320/360/390 px screenshot e verifica
- [ ] Nessun overflow orizzontale; tabelle→cards senza perdita di campi/azioni
- [ ] Drawer hamburger, focus, Escape, overlay e tab order verificati
- [ ] Target touch >=44 px, body >=16 px, label >=14 px, contrasto AA e zoom 200%

## Prove
- [ ] Typecheck / lint / unit test / build / e2e (link run):
- [ ] E2E ruolo A / B o motivazione esecuzione non ancora disponibile:
- [ ] Test negativo autorizzazioni e cross-tenant:
- [ ] Preview Vercel testabile (URL):
- [ ] Problemi noti, limitazioni e rollback:
- [ ] Aggiornato `docs/PROJECT_STATUS.md` con solo evidenze verificate

**Una PR non è “completata” perché il deploy è READY.** Occorrono i gate per i tre formati e per i ruoli coinvolti.
