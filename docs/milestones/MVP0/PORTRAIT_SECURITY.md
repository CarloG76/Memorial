# MVP 0 — Confini di modifica ritratto (27/11/2026)

**Branch:** `feature/mvp0-security-hardening`, PR #11.
**Stato:** codice e migrazione versionati; verifiche SQL su PostgreSQL temporaneo; applicazione al database Memorial non eseguita.

## Modello autorizzativo
- **Famiglia OWNER:** può caricare e aggiornare direttamente il ritratto dei memoriali su cui è attiva.
- **Famiglia EDITOR:** può operare direttamente solo se `can_edit_content=true`.
- **SuperAdmin OWNER:** può caricare/aggiornare il ritratto mantenendo l'identità reale.
- **Agenzia OWNER/OPERATOR:** nessun percorso diretto di aggiornamento del ritratto. Deve usare **Entra come Famiglia** e possedere contesto valido, non scaduto, non chiuso e corrispondente al memoriale/agenzia; l'aggiornamento passa da `agency_family_set_memorial_portrait` ed è registrato in `agency_family_operator_events`.
- **Anonimo, operatori di altre agenzie, contesti chiusi/scaduti:** nessun accesso in scrittura.

## Codice
- Rimosso uploader diretto da `/console/agenzia/memoriali/[id]`; resta il pulsante di ingresso delegato.
- La UI familiare e la UI nel contesto delegato condividono `MemorialPortraitUploader`, che sceglie la RPC con `context_key` se presente.
- Migrazione proposta: `supabase/migrations/20261127154500_mvp0_agency_portrait_delegation.sql`.
- Test SQL CI: `supabase/tests/mvp0_portrait_harness.sql` e `supabase/tests/mvp0_portrait_boundaries.sql` su PostgreSQL 17 effimero.
- Test Playwright per accesso anonimo a preview privata e contesto delegato.

## Deployment sicuro
1. Verificare che le RPC e le tabelle dipendenti siano presenti nella destinazione.
2. Applicare la migrazione in staging dedicato, controllando `pg_policies`, GRANT e oggetti Storage.
3. Provare i tre ruoli e il contesto aperto/chiuso con account test, incluso refresh dopo caricamento.
4. Promuovere la migrazione su progetto operativo **prima** di considerare il sistema protetto. Se Vercel Preview punta al DB produttivo non usare l'ambiente per simulare ruoli senza valutare l'impatto.
5. Integrare la PR solo dopo la verifica delle dipendenze DB. La CI SQL isolata non certifica il comportamento del database operativo.

## Limiti restanti di MVP0
- Upload/ritratto e persistenza da browser con credenziali reali per tutti i ruoli e contesti.
- Test negativi di cross-tenancy con utenti effettivi nel progetto Supabase.
- Verifica della scadenza/revoca su editor, media e pubblicazione, non soltanto ritratto.
- Ricontrollo bucket media e presenza di eventuali file orfani.
- UAT generale rinviata a valle degli sviluppi Famiglia, Inviti/Notifiche, Visitatore, Conservazione e Stripe, secondo la priorità utente.

## Robustezza upload applicativo
- La validazione formato/dimensione è centralizzata in `src/lib/portrait-validation.ts`, con test Vitest per limiti e formati.
- Un errore di validazione azzera la selezione precedente, impedendo il caricamento accidentale di una fotografia diversa.
- L'upload è trattato come due fasi distinte: Storage → RPC di associazione e audit.
- Se la RPC nega il salvataggio, il client tenta la rimozione dell'oggetto appena creato; il cleanup è **best-effort** e la UI segnala l'eventuale fallimento.
- Un'interruzione di rete non genera automaticamente un nuovo caricamento né elimina un file che potrebbe essere già stato associato; la UI chiede di ricaricare e verificare.
- La disponibilità pubblica del bucket `memorial-portraits` rimane un tema aperto di privacy media: non dichiarare il ritratto privato senza una futura migrazione di delivery autorizzato.
