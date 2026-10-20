# M1 — Dashboard iniziali con RLS live

Data: 21 ottobre 2026. Sviluppo ordinario direttamente su `main`.

## Implementato
- `/console/agenzia`: legge **solo** le proprie membership attive, denominazione, piano Free/Pro, stato e conteggio memoriali associati; ogni query è eseguita sotto JWT utente con RLS.
- `/console/famiglia`: legge solo le proprie membership famiglia attive (ruolo e numero memoriali), non biografie, recapiti o contenuti privati.
- `/console/piattaforma`: Owner/Admin legge solo conteggio aggregato agenzie; Finance/Support non hanno lettura trasversale delle anagrafiche.
- Se una query fallisce, non viene presentato un falso conteggio zero: viene mostrato un errore di lettura.
- Le sidebar sono indicatori non cliccabili finché le funzioni della milestone corrispondente non sono attivate.

## Verifiche
- Autorizzazione lato server: `requireWorkspaceAccess` con `getClaims/getUser`, lookup membership sotto RLS; dati scoping tramite DB.
- Su Vercel verificare build Next.js per commit; non equivale a collaudo con utenti reali.
- Test E2E con utenti di ogni ruolo: **non ancora eseguiti**; zero utenti disponibili nel database attuale.

## Non implementato
Contenuti memoriali, messaggi, pagamenti, inviti/accettazione famiglia, statistiche avanzate, funzioni di gestione. Non simulare dati.
