# MEMORIAL — Stato operativo Admin Agenzia (15 novembre 2026)

## Funzionalità disponibili nel codice pubblicato
- **Dashboard Agenzia:** metriche e riepiloghi delle entità assegnate tramite membership.
- **Memoriali:** elenco reale con ricerca per persona, filtri stato/agenzia, dettaglio del singolo memoriale autorizzato.
- **Statistiche:** totale memoriali, Standard/Premium, pubblicati/in preparazione e distribuzione per agenzia. Non confondere con fatturato.
- **La mia agenzia:** scheda aziendale, email di contatto e città modificabili dall'Owner; log audit delle modifiche; dati fiscali solo lettura.
- **Titolare e collaboratori:** anagrafica Owner, inviti agli Operator (7 giorni), revoca e attivazione/disattivazione dei collaboratori tramite RPC. Link da copiare, senza invio email automatico.
- **Amministrazione:** piano assegnato e tariffe di listino PAYG, Pro mensile, Pro annuale; saldo delle **2 attivazioni gratuite lifetime** letto dall'entitlement ledger; inventario ed esportazione CSV con mitigazione formula injection; costi/ricavi fittizi non visualizzati.
- **Due memoriali gratuiti per nuova agenzia:** un'unica transazione Postgres controlla entitlement, crea skeleton Standard/Premium e invito Familia Owner di 72h. Il terzo memoriale gratuito è bloccato dal database. Funzionalità disponibile soltanto per nuove agenzie attivate tramite invito, non retroattivamente alle DEMO.
- **Invito nuova agenzia da SuperAdmin:** token monouso da 72 ore, destinato a email specifica, revocabile, visibile in lista; crea il responsabile Owner alla verifica email e accettazione dei documenti B2B/Privacy. Link copiabile.
- **Notifiche:** campanella nelle tre aree; attività pending derivate dai dati reali con scoping per ruolo (ricordi dei visitatori da approvare, payment pending e agenzie non attive). Aggiornamento periodico; non sono notifiche push o email.
- **SuperAdmin 'Entra come':** stessa componente di Amministrazione e di creazione memoriali gratuiti in contesto Agenzia; navigazione specifica con banner.

## Vincoli reali da rimuovere prima di vendere
1. Nel database **non risultano documenti B2B/Privacy attivi**; per sicurezza l'accettazione dell'invito Owner non può essere completata prima della pubblicazione di documenti legali approvati.
2. **Stripe non collegato**: pagamenti per memoriale, sottoscrizioni mensili/annuali, rinnovi, recesso e download fatture non sono utilizzabili; non creare ordini PAID fittizi.
3. **Email di invito non inviate automaticamente**. SuperAdmin e Agenzia copiano e condividono il link riservato.
4. La versione completa dell'editor famiglia e la pubblicazione individuale di tutti i memoriali (oltre la DEMO Giovanni Rossi) richiedono ulteriori workflow.
5. Le tre agenzie DEMO originarie **non** hanno entitlements gratuiti assegnati per non mutare la baseline del Reset Demo Data; per eseguire una prova dell'onboarding completo serve predisporre un ambiente/test dataset dedicato.
6. I calcoli dei prezzi Premium (+€3) e l'IVA devono ancora essere approvati. I prezzi correnti sono ipotesi commerciali illustrate nell'interfaccia.
7. Il collaudo tecnico SQL è passato per invito owner (72h), due attivazioni gratuite e blocco della terza (transazioni rollback); il collaudo browser con sessioni agency/family effettive rimane da eseguire.

## Come accedere
- SuperAdmin Agenzie: `/console/piattaforma?sezione=agenzie`
- Agency Dashboard: `/console/agenzia?sezione=dashboard`
- Agency Memoriali: `/console/agenzia?sezione=memoriali`
- Agency Statistiche: `/console/agenzia?sezione=statistiche`
- Agency Amministrazione: `/console/agenzia?sezione=amministrazione`
- Agency La mia agenzia: `/console/agenzia?sezione=la-mia-agenzia`

Principio prodotto: la demo commerciale deve essere un **flusso realmente persistente**, non una simulazione di pagamento o pubblicazione.
