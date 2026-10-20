# M1 — Accesso e registrazione (WF01)

Data: 20/10/2026. Stato di partenza verificato: Supabase Auth `auth.users` contiene **0 utenti** e `public` non ha tabelle applicative. Non esiste quindi un account SuperAdmin utilizzabile. Nessuna credenziale è stata generata.

## Link
- Login: https://memorial-ai-visions.vercel.app/accedi
- Registrazione agenzia: https://memorial-ai-visions.vercel.app/registrati
- Conferma email: `/auth/confirm` (PKCE code oppure token hash email).
- Conferma di richiesta: `/registrati/esito`.

## WF01 — Stato parziale, senza attivare clienti
1. Creazione credenziali responsabile tramite Supabase Auth: codice disponibile dietro il gate `AGENCY_SIGNUP_ENABLED` + `B2B_PRIVACY_NOTICE_URL` HTTPS.
2. Verifica email: handler SSR su `/auth/confirm`; supporta `code` o `token_hash` email, nessun redirect controllato dal chiamante.
3. Dati dell'agenzia nella fase di registrazione: ragione sociale, partita IVA con controllo formale/check digit, indirizzo email, password almeno 12 caratteri. Questi dati sono temporaneamente nella metadata NON FIDATA di Auth; nessuna membership/ruolo può essere derivata dai metadati.
4. **Ancora da sviluppare/attivare:** contratto B2B/versione/accettazione con timestamp e audit; completamento dati e registrazione transazionale in tabella `agencies`; attribuzione `AGENCY_OWNER`; piano Free. Non fingere che email verificata equivalga ad account agenzia attivo.

Il gate è chiuso per impostazione predefinita perché il testo definitivo di informativa e condizioni B2B non è nella documentazione approvata. Non si raccolgono dati prima della sua pubblicazione. La configurazione Auth deve inoltre abilitare verifica email, Site URL e Redirect URL relativi al dominio definitivo. Le impostazioni Supabase Auth non sono state alterate.

## SuperAdmin — separato dalla registrazione agenzia
Il SuperAdmin è uno e solo uno, assegnato per provisioning controllato ad una identità verificata, con MFA. Non usare `/registrati` per attribuire il ruolo. La migrazione candidata M1 include l'indice `platform_one_active_owner`, che impedisce due owner attivi, ma è ancora da collaudare e applicare. Nessuna procedura pubblica di auto-promozione.

## Verifiche necessarie
- CI Vitest/Playwright: pagina, link, gate fail-closed, token invalido, login anonimo.
- Auth Integration: email di test, conferma e scadenza, contatto già esistente, P.IVA usata, sessioni.
- DB: test cross-tenant, grant RLS, transazione registrazione con enforcement agency owner e Terms version.
- Rate-limit/CAPTCHA risk-based e casistiche abuso prima di aprire registrazione pubblica.
- Verifica GDPR/termini B2B a livello legale, prima di raccogliere utenti reali.

## Rollback
Revert dei file UI/Auth; `AGENCY_SIGNUP_ENABLED=false` disabilita immediatamente nuove registrazioni anche se il frontend è disponibile. Non cancellare utenti o tabelle senza autorizzazione.
