# MEMORIAL — Audit funzionale e riconciliazione delle specifiche
**Data:** 24 novembre 2026 · **Owner:** Carlo Gonella · **Perimetro:** codice GitHub main, schema e funzioni Supabase, deployment Vercel e struttura Testiny MEMOR.

## Criteri di classificazione
- **Presente:** UI e percorso backend esistono; NON implica test browser superato.
- **Parziale:** esiste parte del flusso ma non un journey completo e verificato.
- **Simulato:** algoritmo/UI DEMO separati dalle operazioni commerciali reali.
- **Inesistente:** non individuato percorso operativo nel codice; non testare.
- **Da collaudare:** implementato ma senza evidenza end-to-end manuale nel percorso utente.

## Fonti controllate
- GitHub `CarloG76/Memorial`: pagine App Router, componenti, funzioni di dominio, test Vitest/Playwright e migrazioni.
- Supabase progetto Memorial: 36 tabelle pubbliche, RPC tra cui `family_save_memorial_editor`, `family_publish_memorial_context`, `agency_start_family_context`, `agency_create_free_memorial`, `set_memorial_portrait`, `get_published_memorial_by_token`.
- Dataset corrente: 3 agenzie DEMO, 13 memoriali DEMO, 11 membership Famiglia DEMO, 2 ricordi e 2 pensieri demo. Solo 1 memoriale in `PUBLISHED_ACTIVE`.
- Testiny: progetto MEMOR, cartelle per aree, 64 casi funzionali, run TR-1 con tutti NOT RUN.

## Inventario feature e testabilità
| ID | Capacità / comportamento | Stato | Percorso / evidenza codice | Testiny |
|---|---|---|---|---|
| F01 | Login, logout e cambio password | Presente, E2E da collaudare | `/accedi`, `/account/password`, auth SSR | FT-001/006 |
| F02 | Registrazione agenzia e gate | Parziale / condizionato da flag | `/registrati`, `/console/onboarding` | FT-007 |
| F03 | Inviti Agenzia e Famiglia | Presente, E2E da collaudare | `/invito-agenzia`, `/invito-famiglia`, `/invito-titolare` | FT-008/009 |
| F04 | SuperAdmin: cataloghi, filtro, anagrafiche | Presente, E2E da collaudare | `/console/piattaforma`, `demo-catalog.tsx` | FT-010/015 |
| F05 | Audit e reset DEMO | Presente; reset solo staging/test protetti | RPC `platform_get_change_log`, `platform_reset_demo_data` | FT-014/015 |
| F06 | Agenzia: dashboard, lista, filtri, dettaglio | Presente, E2E da collaudare | `agency-console-sections.tsx`, dettaglio memoriale | FT-016/018 |
| F07 | Agenzia: recapiti, team e inviti | Presente, E2E da collaudare | `agency-team-manager.tsx`, RPC team | FT-019/020/057 |
| F08 | Agenzia: due gratuiti e skeleton | Presente per percorso free, E2E da collaudare | `agency-free-memorial.tsx` e RPC | FT-021/022 |
| F09 | Prezzi e checkout DEMO | **Simulazione**, non pagamento | `agency-demo-checkout.tsx` | FT-023/024 solo informazione listino |
| F10 | Stripe reale, subscription, fatture | **Non implementato** | `stripe-payments/SPEC.md` proposta | Nessun test |
| F11 | Famiglia: biografia, dedica, timeline | Presente, E2E da collaudare | `family-memorial-content-editor.tsx` | FT-025/027 |
| F12 | Ritratto in Storage / persistenza DB | Presente, upload browser da collaudare | `memorial-portrait-uploader.tsx`, `set_memorial_portrait` | FT-028/029 |
| F13 | Sfondi e anteprima privata specifica | Presente, E2E da collaudare | `family-background-editor.tsx`; `/memoriale/anteprima/[id]` | FT-031/042 |
| F14 | Ricordo familiare auto-approvato | Presente | `family-direct-memory.tsx`, `family_create_direct_memory` | FT-030 |
| F15 | Deleghe SuperAdmin: Agenzia/Famiglia | Presente, E2E da collaudare | `superadmin-open-as-workspace.tsx`, context RPC | FT-032/033 |
| F16 | Delega Agenzia → Famiglia | **Implementato**: UI editor (biografia, dedica, timeline), foto, ricordi e pubblicazione; moderazione Edge v3; da collaudare in browser | `/console/agenzia/entra-come-famiglia/[contextId]` | FT-034/035 |
| F17 | Pubblicazione owner e delegata con consenso/audit | Presente, E2E da collaudare | `family-memorial-publisher.tsx`, RPC context | FT-036/043 |
| F18 | Pagina pubblica per token | Presente, E2E da collaudare | `/memoriale/p/[token]` | FT-041/043 |
| F19 | Giovanni DEMO e Gino preview distinta | Presente | `/memoriale/demo`; `/memoriale/anteprima/[id]` | FT-044/051 |
| F20 | Ricordi con foto visitatore e moderazione | Presente, E2E da collaudare | `visitor-memory-flow`; `family-visitor-memories.tsx` | FT-045/050 |
| F21 | Galleria SuperAdmin | Presente, E2E da collaudare | `superadmin-memorial-media.tsx` | FT-056 |
| F22 | Galleria completa gestita dalla famiglia | **Parziale** / backlog | assenza di flusso familiare completo | Nessun test come gallery completa |
| F23 | Messaggi privati, PIN e consenso granulare | **Non implementato** | placeholder/specifica | Nessun test |
| F24 | Ricorrenze, renewals, export, static archive | **Non implementato** | specifica futura | Nessun test |
| F25 | Crowdfunding / Stripe Connect | **Non implementato; legal gate** | specifica futura | Nessun test |
| F26 | AI migliora ritratto | **MVP+ pianificato**, non implementato | roadmap 20/11 | Nessun test |

## Gap e contraddizioni da risolvere PRIMA di sviluppare altro
1. **Listino canonico obsoleto nei file originali.** Vale l'ultima decisione: PAYG €19,90 Std / €22,90 Premium; Pro mensile €39,90 e €13,90 / €16,90; Pro annuale €379 e €11,90 / €14,90. Regola due attivazioni iniziali gratuite applicabile ai nuovi account secondo entitlement.
2. **Delega Agenzia→Famiglia estesa il 24/11:** editor biografia/timeline, ricordi diretti e moderazione visitatori ora hanno codice e permessi in contesto Agenzia; manca UAT completa via browser.
3. **Upload ritratto delegato.** Il componente usa RPC/storage senza context_key: occorre verificare e realizzare autorizzazioni delegate coerenti e audit nel contesto. Il test FT-028 può rilevare bug: non anticipare PASS.
4. **Ricordo diretto Agenzia delegata:** RPC estesa al contesto Agenzia, test SQL transazionali OK; UAT browser ancora NOT RUN.
5. **Moderazione visitatori:** funzione Edge aggiornata alla versione 3 per contesto Agenzia; test browser UAT non ancora eseguito.
6. **Pagine placeholder:** assistenza, contatti/anniversari/famiglia e impostazioni non sono feature testabili; non aggiungere test di esecuzione.
7. **Stato del codice ≠ correttezza.** La build READY e i test SQL puntuali non dimostrano che i flussi UI soddisfino la UAT.
8. **Conservazione.** Il campo `covered_until` è valorizzato alla pubblicazione ma la gestione completa dei rinnovi e garanzie statiche non è operativa; non venderla come completa.

## Test management
- **Test plan:** documento `docs/testing/2026-11-24-functional-testbook.md` e presente audit.
- **Suite:** cartelle Testiny per ciascuna area attiva.
- **Test cases:** 64 casi nel progetto `MEMOR`, descritti con azione e risultato atteso.
- **Run:** `TR-1` «UAT 01 · Functional Testbook MEMORIAL · Baseline 24-11-2026», 58 `NOT RUN`.
- Test case per future feature non creati; le cartelle vuote sono placeholders organizzativi, non test da eseguire.

## UAT sequenziale suggerita
1. Login e dashboard per ruoli (FT-001…).
2. Agenzia: memoriali, configurazione, free entitlement, inviti.
3. Famiglia: editor, ritratto, ricordi, sfondi, refresh.
4. SuperAdmin e Agenzia: ingressi delegati, confini e uscita.
5. Prima pubblicazione in staging e link visitor.
6. Proposta visitor e moderazione.
7. Responsive ed error handling.
8. Solo dopo questa baseline, decidere i fix di sviluppo ordinati per impatto.

**Conclusione:** esiste una base funzionale articolata, ma il prodotto non è certificato E2E né pronto per checkout reale. La prossima attività è la UAT manuale, non aggiungere altre feature prima di aver censito i difetti.

## Verifica sprint delega Agenzia 24/11
**Owner: Carlo Gonella.** Nuove RPC `family_get_memorial_editor_context`, `family_save_memorial_editor_context`, `agency_family_set_memorial_portrait`; `family_create_direct_memory` estesa ad Agency context; Edge `visitor-memory-flow` versione 3. UI Agenzia→Famiglia integra editor, ricordi, moderazione e pubblicazione. SQL transazionale con rollback eseguito per lettura/scrittura/ricordo/audit e blocco contesto chiuso. Casi UAT FT-059…064 creati e NON eseguiti nel browser.
