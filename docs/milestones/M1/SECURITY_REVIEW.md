# M1 — Revisione sicurezza: database operativo

Data verifica 21/10/2026 (ora italiana), timestamp migrazioni 20/10 UTC. Progetto `ojzkikhtcrqcpsvhepbp`.

## Verifiche realmente eseguite
- Baseline e onboarding: entrambe le migrazioni DDL applicate con successo, risultato del catalogo live 9/9 RLS.
- `has_table_privilege`: ruolo anon senza SELECT su tutte le tabelle; ruolo authenticated senza INSERT/UPDATE su nessuna.
- Inviti e accettazioni legali: nessun grant SELECT autenticato; nessuna riga demo creata.
- `public.complete_agency_registration` era SECURITY DEFINER eseguibile da authenticated: WARN del Security Advisor.
- Hardening `20261020220855`: implementazione spostata in `app_private`, endpoint pubblico ricreato SECURITY INVOKER, EXECUTE negato ad anon.
- Dopo hardening: security advisor senza WARN; due INFO di `rls_enabled_no_policy` per `family_invites` e `agency_registration_acceptances`, scelta di negazione deliberata e ulteriormente rinforzata da REVOKE SELECT.

## Limiti ancora esistenti
- PostgreSQL CI: stato della run push non letto dal connettore GitHub; NON dichiarare quei test passati.
- Test reali multi-tenant con account Supabase e JWT firmati non effettuati. Il catalogo verificato non dimostra la qualità delle policy su dati non vuoti.
- `app_private` non deve essere incluso tra gli schemi Data API esposti. Se cambia la configurazione Supabase, rivalutare immediatamente il perimetro.
- Registrazione Free non attivabile finché i documenti B2B non sono pubblicati e approvati; non esistono utenti/agency registrati dalla procedura.

## Prossime verifiche
1. Confermare CI Postgres SQL ed E2E sulla revisione GitHub attuale.
2. Testare più identità Auth reali in staging isolato (non creato: costo citato dal provider di $0,01344/ora, richiede autorizzazione).
3. Attivare signup solo dopo test su email/anti-spam e approvazione di privacy e condizioni B2B.
