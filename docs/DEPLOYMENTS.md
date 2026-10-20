# MEMORIAL — Ambienti e deployment

## Git e ambienti
- Repository: `CarloG76/Memorial` (pubblico), branch principale: `main`.
- Vercel: `memorial`, framework Next.js, Node 24, deploy automatici in Production ad ogni push `main`.
- I branch `feature/*` sono per **ogni nuova richiesta extra** alle specifiche (non soltanto Stripe), con Preview, test, merge e registrazione dedicata.
- URL principale: `https://memorial-ai-visions.vercel.app`. Protezione di accesso secondo SSO Vercel già configurata.
- Variabili `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` configurate per Production/Preview/Development, senza chiavi private nel repo.

## Deployment versionati (20/10/2026)
- M0 integrata via PR #1, codice base Next.js.
- M1 integrata via PR #2, SQL candidata **non applicata** al DB Supabase.
- Rafforzamenti M1: deploy READY sul commit `f211f4ff`.
- Preventivazione M2: deploy READY sul commit `6dd22c51`, deployment ID `dpl_5uiKmdVAGCX7Nz9tXugi7VJ4v7gD`.

## Controlli obbligatori
Distinguere SEMPRE `CODIFICATO` → `CI_PASS` → `DEPLOYED` → `RUNTIME_VERIFIED` → `ATTIVO`.
Un deploy READY indica compilazione e distribuzione, non test dei token Auth reali, autorizzazioni RLS o completezza di workflow B2B.
Per M1 è stato aggiunto un job PostgreSQL 17 temporaneo alla pipeline GitHub: il suo esito non è deducibile da Vercel, verificare la run specifica GitHub Actions.

## Sicurezza e rollback
Nessuna scrittura sul database live da questi commit. SQL non applicato automaticamente con i push; migrazioni richiedono audit e test isolati. La gestione di pagamenti reali, dati personali e pubblicazione pubblica necessita dei rispettivi controlli e autorizzazioni, separati dal merge. In caso di errore codice: revert puntuale su `main` e verifica nuovo deployment; mai DROP/RESET dati reali automatici.
