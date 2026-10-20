# M1 — Blocchi e questioni aperte

## Tecniche (non decisioni business)
1. Staging PostgreSQL isolato da predisporre, costo e creazione solo previa approvazione se fatturabile.
2. Applicare migrazione M1 su staging e testare RLS per 2 agenzie + 2 memoriali, famiglia owner/editor/viewer, visitatore anon, platform admin/finance/support.
3. Sicurezza di write server workflows: registrazione agenzia, creazione inviti, accettazione e revoca token hash; necessaria idempotenza, audit e test race.
4. Provisioning SuperAdmin: solo persona esplicitamente autorizzata, mai self-grant, no seed di utenti reali, MFA per staff.
5. Allineamento versioni `@supabase/ssr` e Supabase Auth dopo test connessione su Preview.
6. M0 deve superare CI; lockfile assente finché non versionato.
7. Le membership delle console indicano solo accesso all'ambiente. I controlli di permesso per singola azione/riga verranno introdotti nelle API successive.

## Decisioni prodotto ereditate
Restano aperte le questioni ufficiali di `02_APERTI.md`. M1 non anticipa prezzi, date parziali, storage media o policy di cancellazione.
