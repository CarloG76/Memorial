# M1 — Identity e Tenancy: implementazione

## Oggetti attualmente versionati
- `supabase/migrations/20261020220618_m1_identity_tenancy.sql` — candidato di schema, **non applicato sul DB Memorial**.
- Sette tabelle: `profiles`, `platform_memberships`, `agencies`, `agency_members`, `memorials` minimale, `family_members`, `family_invites`.
- RLS deny-by-default, SELECT sotto policy, nessun grant DML per anon/authenticated; hash inviti non esposti.
- Vincolo database `platform_one_active_owner`: al massimo un ruolo OWNER di piattaforma attivo, in coerenza con la regola di un solo SuperAdmin. Nessun utente viene automaticamente assegnato a quel ruolo.
- `src/lib/authz` — guard delle aree di lavoro basato su membership server-side e identità verificata.
- `src/app/api/v1/me` — elenco delle aree consentite senza dettaglio tenant.

## Audit del 20/10/2026 contro i documenti canonici
Fonti: `01_DECISIONI.md` (prevale), `02_APERTI.md`, `05_RUOLI_PERMESSI.md`, `08_STATES_API.md`, `09_ARCHITETTURA.md`, `10_DATABASE_GUIDA.md`, `14_SCHEMA.sql`, `15_RLS.sql`.

- Ruoli confermati: platform OWNER/ADMIN/FINANCE/SUPPORT; agency OWNER/OPERATOR; family OWNER/EDITOR/VIEWER; moderazione come capability, visitatore senza login obbligatorio.
- Riservatezza: le agenzie non possono leggere dettagli familiari, immagini e messaggi privati; Staff Support/Finance non riceve lettura trasversale dei memoriali.
- Lo schema preliminare `14_SCHEMA.sql` **non** deve essere eseguito direttamente né sommato al candidato M1: ha tabelle sovrapposte, enum e campi di prodotto da migrazioni successive; la migrazione M1 crea solo l'identità multi-tenant minima.
- Mancano ancora accettazione inviti, registrazione self-service agenzia, audit scritture, provisioning SuperAdmin, verifica MFA personale. NON dichiararli completi.
- Le questioni aperte su dati personali, cancellazione/retention, pagamenti/riattivazioni non sono state risolte né anticipate.

## Collaudo SQL automatizzato senza nuovo Supabase a pagamento
Il job `postgres-rls` nella GitHub Actions avvia `postgres:17-alpine` in ambiente **temporaneo e isolato**, ricrea solo gli oggetti indispensabili di `auth` per `auth.uid()`, applica il file migrazione candidato e lancia:
1. `supabase/tests/M1_readonly_security_assertions.sql` (grant, schema, RLS).
2. `supabase/tests/M1_cross_tenant.sql` (anon, due agenzie, due memoriali, family owner/editor/viewer, staff admin/finance/support, tentate escalation, inviti).
Le SELECT sono verificate dopo `SET LOCAL ROLE authenticated` con JWT claims di utenti sintetici; **non** vengono testate da superuser. I dati non sono mai caricati nel progetto Supabase operativo.

Il job CI non equivale al test di PostgREST/Auth e storage reale. Quando lo schema viene validato, testare anche con access token Supabase in un ambiente autorizzato; non introdurre segreti o costi imprevisti.
