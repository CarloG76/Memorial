# MEMORIAL — Responsive & Accessibility Definition of Done

**Obbligatorio per ogni schermata, ogni ruolo, ogni milestone.** Il responsive non è una funzionalità da pianificare dopo il desktop.

## Ambiti
Piattaforma (SuperAdmin/Admin/Finance/Support); Agenzia (Owner/Operator); Famiglia (Owner/Editor/Viewer); Visitatore anonimo e verificato, onboarding, accesso, impostazioni e flussi pubblici.

## Viewport di riferimento
- Smartphone piccoli: 320–375 px; smartphone standard 390–430 px.
- Tablet portrait: 768–834 px; tablet landscape: 1024 px.
- Desktop: 1280–1440 px e oltre.
- Breakpoint console introdotti: <= 1100 px navigazione a cassetto; <= 760 px contenuti impilati.
- Non assumere orientamento fisso. Supportare zoom 200% e preferenza riduzione movimento.

## Navigazione
- Desktop: sidebar persistente e voce corrente evidenziata.
- Tablet/mobile: pulsante hamburger, drawer con overlay e chiusura tramite bottone, fuori drawer ed Escape.
- Tasti Tab intrappolati nel drawer aperto, focus iniziale e ripristino al bottone.
- Link utilizzabili, tap target >= 44×44 px, eventuali sezioni non implementate chiaramente segnalate.

## Dati e input
- KPI: 4/2/1 colonne secondo larghezza reale; numeri non tagliati.
- Tabelle larghe: cards con etichette di campo, senza obbligare allo scroll orizzontale.
- Filtri, ricerca, selettori, form e dialog: impilati e azionabili con touch.
- Stati loading, empty, error, success, access denied adattati ai tre formati.
- Nessun testo fondamentale nascosto per mancanza di spazio; almeno 14 px nelle etichette e 16 px nei campi.
- Non inserire dati demo nel codice: account, preferenze e dati persistono in Supabase.

## Requisito di completamento (gate)
Ogni PR di prodotto deve riportare evidenza per:
- [ ] Desktop verificato
- [ ] Tablet portrait & landscape verificati
- [ ] Smartphone 360–390 px verificato
- [ ] Navigazione tastiera, focus, contrasto e target touch verificati
- [ ] Nessun overflow orizzontale della pagina o perdita di dati importanti
- [ ] Aggiornamento della checklist operativa e delle eventuali eccezioni

**Non contrassegnare completata una schermata se anche uno dei gate obbligatori non è provato.**

## Stato implementazione del baseline 22/10/2026
- [x] Shell autenticata condivisa, tre ruoli: hamburger e drawer tablet/mobile, focus management, Escape, overlay.
- [x] Tabelle principali SuperAdmin, Agenzia, Famiglia e dettagli convertibili in schede responsive con etichette di campo.
- [x] Breakpoint CSS, KPI responsive, form e filtri flessibili.
- [x] Suite Playwright estesa a Chromium Desktop, Tablet (834 px), Mobile iPhone.
- [~] Test automatici pagine pubbliche senza overflow definiti. Esecuzione CI da verificare.
- [ ] E2E autenticato e confronto visivo effettivo su Preview: richiede ambiente accessibile e credenziali di collaudo; suite opzionale già predisposta.
- [ ] Audit di tutte le future schermate Economia, Statistiche, Assistenza, Agenzia e Famiglia prima di chiuderle.
