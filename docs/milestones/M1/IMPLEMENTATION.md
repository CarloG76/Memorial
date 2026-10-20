# M1 — Implementazione proposta

## Schema
`supabase/migrations/20261020190000_m1_identity_tenancy.sql` contiene sette tabelle:
1. `profiles`: dati di presentazione non sensibili, un profilo per auth user.
2. `platform_memberships`: ruoli piattaforma approvati.
3. `agencies`: anagrafica B2B minima, stato ACTIVE/SUSPENDED/CLOSED.
4. `agency_members`: membership per agenzia, ruolo OWNER/OPERATOR.
5. `memorials`: **solo** identità UUID e FK `agency_id` per permettere family membership; dati prodotto/contatti/media/URL rimandati a M2.
6. `family_members`: permission flags associati a `memorial_id`.
7. `family_invites`: hash del token, email, ruolo, scadenza; nessun accesso client diretto.

### RLS e grants
- RLS abilitata su tutte le sette tabelle.
- Anon: nessun privilegio diretto su tabelle.
- Authenticated: SELECT solo su proiezioni personali/tenant autorizzati; nessun INSERT/UPDATE/DELETE.
- Helper SQL `app_private` con `SECURITY DEFINER`, `search_path=''`, controlli `auth.uid()`, grant execute soltanto a `authenticated`. Lo schema non va esposto come API.
- Membri famiglia vedono soltanto la propria membership o, se OWNER, altre membership dello **stesso** memoriale; inviti protetti.
- Agenzia può vedere anagrafica e membership solo nel proprio scope; staff OWNER/ADMIN vede dati minimi delle agenzie, non i contenuti privati.

**Non è presente alcun meccanismo di assegnazione arbitraria di ruoli dal browser.**

## Codice applicativo
- `src/lib/authz/workspaces.ts`: lista ruoli e funzione pura per negazione/visibilità delle console.
- `src/lib/authz/server.ts`: verifica cookie JWT tramite `getClaims()`, poi lookup membership sotto RLS; se query non riuscita, nessuna autorizzazione.
- `src/app/console`: selezione delle sole aree con membership; area specifica protetta lato server.
- `src/app/api/v1/me`: risposta minima sulle aree disponibili con `requestId`, senza dump membership o tenant.
- Reindirizzamento login/PKCE verso selettore neutro `/console` (non assume agenzia di default).
- `supabase/tests/M1_readonly_security_assertions.sql`: preflight SQL da eseguire **solo su staging post-migrazione**.
- `e2e/m1-authz.spec.ts`, `src/lib/authz/workspaces.test.ts`: test negativi e logica ruolo.

## Scritture intenzionalmente assenti
Registrazione di un'agenzia, creazione/accettazione inviti, bootstrap SuperAdmin e provisioning membership restano disabilitati: richiedono endpoint transazionali auditati, policy di invito e casi E2E con Supabase Auth. I nomi e le relazioni sono preparati; un telaio UI non viene spacciato per workflow completo.

## Norme della baseline
`01_DECISIONI.md` prevale; `02_APERTI.md` mantiene le scelte non approvate. Nessuna regola tariffaria, pagamento, archiviazione o cancellazione dati viene introdotta da M1.
