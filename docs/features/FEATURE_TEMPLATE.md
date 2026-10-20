# <slug> — <titolo>

**Data richiesta:**
**Origine:** nuovo requisito / modifica / integrazione isolata
**Branch:** `feature/<slug>` (da `main`)
**Milestone correlata:**
**Stato:** PROPOSTA

## 1. Richiesta e differenza rispetto alla fonte ufficiale
Descrivere la richiesta in termini funzionali, indicando cosa è già definito in `01_DECISIONI.md` e cosa è un elemento *nuovo*. Non approvare automaticamente decisioni in `02_APERTI.md`.

## 2. Criteri di accettazione
Specificare input, output, permessi, errori, responsive, osservabilità e limiti.

## 3. Architettura e impatto
File UI/API, tabelle RLS, versioni, integrazioni, variabili d'ambiente, dipendenze, costi e controlli sicurezza.

## 4. Test e deployment di Preview
Tabella esiti per unit, integration, E2E, ruoli negativi, concorrenza; commit SHA, run CI, URL Vercel e stato reale. Per pagamenti: solo modalità test.

## 5. Merge verso main
PR, eventuali conflitti, review, commit merge, regressioni e verifica deployment `main`.

## 6. Attivazione funzionale
Distinguere codice mergiato da funzionalità abilitata e dati reali. Elencare eventuali approvazioni esplicite necessarie.

## 7. Rollback e questioni aperte
Strategia senza perdita di dati; eseguire operazioni distruttive solo con autorizzazione.
