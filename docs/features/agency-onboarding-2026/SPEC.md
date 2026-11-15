# Agency onboarding and billing — nuova specifica proposta (15/11/2026)

**Stato:** business model aggiornato dal committente; integrazione Stripe/onboarding a invito DA IMPLEMENTARE.
Questa scheda **sostituisce commercialmente**, previa sincronizzazione documentale, i prezzi e i crediti in `01_DECISIONI.md`, `04_BUSINESS.md`, `07_WORKFLOW.md` e nel mock corrente. **Non è un checkout operativo**.
Il sovrapprezzo Premium +3€ e il trattamento IVA richiedono approvazione esplicita.

## Offerta B2B — nessun credito ricorrente
- Ogni **nuova** agenzia invitata riceve due memoriali iniziali gratuiti, una sola volta, non per mese e non per cambio piano.
- I due memoriali possono essere rivenduti dall'agenzia a qualsiasi prezzo nei propri pacchetti; Memorial fattura esclusivamente all'agenzia.
- Dopo due attivazioni gratuite, ogni nuovo memoriale richiede un pagamento unitario. L'abbonamento, se sottoscritto, dà una tariffa unità scontata ma **non** contiene memoriali inclusi.
- Prezzo Standard: **PAYG €19,90**, PRO mensile **€13,90 + €39,90/mese**, PRO annuale **€11,90 + €379/anno**.
- Prezzo Premium **proposto +€3**: PAYG €22,90; PRO mensile €16,90; PRO annuale €14,90.
- Anno iniziale di permanenza incluso nel memoriale; prolungamenti e IVA rimangono trattati separatamente secondo le condizioni legali applicabili.
- La durata dei memoriali pagati e dei due gratuiti non deve dipendere dalla prosecuzione dell'abbonamento.
- Non introdurre token/crediti; usare un contatore transazionale `free_activations_used` derivabile da entitlements/ordini persistenti.

## Regole di pricing e convenienza
- A parità di mix Standard/Premium, mensile vs PAYG: risparmio 6€/memoriale, pareggio dal **7° memoriale nel mese** (39,90/6).
- Annuale vs PAYG: risparmio 8€/memoriale, pareggio dal **48° memoriale nell'anno** (379/8).
- Annuale vs 12 mesi mensili: canone risparmiato 99,80€/anno e 2€/memoriale; ha senso se uso stabile e disponibilità a impegnarsi annualmente.
- Tutti i conteggi sono di **nuovi memoriali oltre i primi due gratuiti**, assumono medesimo mix e nessun effetto IVA.
- Messaggio commerciale: «Attivi oggi, offri due memoriali senza costi Memorial, decidi dopo come continuare». Non promettere conversione garantita.

## SuperAdmin -> invito 72 ore -> agency owner
1. SuperAdmin > Agenzie > **Crea invito agenzia**: ragione sociale, P.IVA/identificatore fiscale, paese, email nominativa del responsabile, eventualmente indirizzo.
2. Server verifica duplicati dell'entità fiscale e dell'email, crea agency PENDING e invitation con nonce CSPRNG hashato, `expires_at=created_at+72 hours`, singolo utilizzo, revocabile; NON crea sessione o imposta password per il destinatario.
3. Mail transazionale al destinatario se provider configurato; link copiabile dal SuperAdmin quando la consegna non è disponibile. Registrare data invio e stato, senza fingere consegna.
4. Destinatario apre il link: verifica token e email prevista, accetta termini B2B e privacy versionati; imposta password tramite Supabase Auth sicuro (niente password in query string). Richiedere conferma che l'account appartiene alla email invitata.
5. In transazione: consuma l'invito, lega OWNER all'agenzia, passa ACTIVE, inizializza diritto a **2 attivazioni gratuite lifetime**, crea Stripe customer quando necessario. Concorrenza/retry non possono ricreare o duplicare entitlements.
6. Redirect alla **Dashboard Agenzia** con CTA «Crea il tuo primo memoriale gratuito» e indicatore **2 attivazioni iniziali ancora utilizzabili** basato su entitlements server, non su un contatore UI.
7. Invito scaduto: pagina dedicata e riemissione SuperAdmin; il precedente viene revocato. La creazione pubblica autonoma deve essere disabilitata/nascosta nella modalità invitation-only.

## Agency -> nuovo memoriale -> family invite
1. Agenzia sceglie Standard o Premium, nome persona, eventuali date, email del referente familiare, durata iniziale/estensioni.
2. Server crea **reservation** con idempotency key e prezzo congelato in centesimi, versione listino, IVA e riferimento dell'agenzia. Controlla se resta una delle due attivazioni gratuite.
3. Se diritto gratis ancora disponibile: **consuma 1 in transazione** solo quando il memoriale viene attivato, evitando uso multiplo concorrente; prezzo 0 per il solo primo anno/creazione e nessuna chiamata Stripe.
4. Se diritti gratis esauriti: checkout Stripe `mode=payment` per il prezzo Standard/Premium coerente con piano attivo. Nessuno skeleton utilizzabile prima del webhook di incasso verificato; non attivare dall'URL di success.
5. Webhook verificato e idempotente produce entitlements/ordine PAID, attiva skeleton riservato e genera invito familiare (token con scadenza e destinatario verificato). Famiglia compila biografia, tappe, ricordi e autorizza la pubblicazione.
6. L'agenzia è il cliente pagatore di Memorial. Se «la famiglia sceglie Premium», l'agenzia deve autorizzare/effettuare il relativo upgrade B2B: niente pagamento automatico della famiglia a Memorial, salvo futura modifica contrattuale approvata.
7. Una bozza eliminata prima dell'attivazione non consuma il free; dopo attivazione il free non deve rigenerarsi cancellandola. Gestire eventuali rimborsi/annullamenti con regole contrattuali, non con reset del contatore.

## Stripe subscriptions & cancellation
- Stripe Checkout `mode=subscription` per 39,90/mese o 379/anno; rinnovo automatico, dicitura esplicita di ricorrenza e condizioni di recesso.
- Stripe customer ID e subscription ID associati all'agenzia; prevenire due sottoscrizioni simultanee.
- Webhook firmati per `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated/deleted`, `checkout.session.async_payment_succeeded` ove pertinente; idempotenza su `event.id`.
- Attivare prezzi Pro **solo dopo** pagamento iniziale confermato; in caso di unpaid/past_due la regola di sospensione va approvata ed esplicitata. I memoriali già pagati restano accessibili.
- Stripe Customer Portal per carta, fatture Stripe disponibili e cancellazione; default cancellazione a fine periodo già pagato. Anche gli abbonamenti annuali rinnovano automaticamente salvo disdetta.
- Formule di prezzo e importi **server-side**, snapshot storico immutabile; non fidarsi di valori browser.
- Il canone non compra memoriali; ogni memoriale aggiuntivo richiede comunque un checkout distinto (prima di eventuali ottimizzazioni di incasso batch).
- Fatturazione elettronica/IVA/corrispettivi da integrare e verificare per il mercato italiano.

## Stato UI oggi e limiti
- L'area Amministrazione non deve più mostrare «crediti Pro» o vecchi prezzi.
- L'attuale `/registrati` consente un percorso autonomo: sostituire con invitation-only **solo quando** il nuovo onboarding è operativo end-to-end, per non bloccare accidentalmente account esistenti.
- L'attuale `/invito-agenzia/[token]` è per **operatori dell'agenzia**, NON per creare una nuova agenzia. Non riutilizzare lo stesso permesso senza progettare inviti agency-owner separati.
- Non assegnare 2 free retroattivi ai 3 record DEMO né a tutte le agenzie legacy senza regola di migrazione esplicita.
- Questo documento non attiva pagamenti né accessi nuovi.

## Priorità
P0: approvazione sovrapprezzo Premium (+3), prezzi IVA, free Premium consentito, durata e condizioni.
P1: nuovo invito owner 72h + autentica attivazione + due free lifetime atomici.
P2: creazione memoriale free e invito famiglia funzionanti.
P3: Stripe PAYG per unità e Stripe Billing per abbonamenti (test mode prima del live).
P4: Customer Portal, sospensioni, fatture, audit e report.
