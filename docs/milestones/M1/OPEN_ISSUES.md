# M1 — Blocchi e questioni aperte

Il codice è stato integrato su `main` con PR #2. Questo non equivale a migrazione validata o autorizzazione live.

1. Serve uno staging PostgreSQL isolato (da valutare costo prima di crearlo) per applicare una migrazione di prova.
2. Eseguire test negativi RLS: due agenzie, due memoriali, famiglia OWNER/EDITOR/VIEWER, visitatore anonimo e ruoli staff separati; controllare i grants e token.
3. Completare i workflow server-side di registrazione agenzia, inviti, accettazione/revoca con audit, scadenza, idempotenza e concorrenza.
4. Bootstrap SuperAdmin solo su identità esplicitamente autorizzata, mai self-grant; prevedere MFA.
5. Testare Supabase Auth SSR e cookie con utenti verificati in ambiente di test; rilevare gestione sessioni e errori.
6. Membership console è soltanto l'ingresso; ogni futura operazione necessita enforcement su specifica agency/memorial/resource.
7. Preview Vercel protette non apribili in lettura dal connettore corrente a causa di HTTP 403; verificare con account autorizzato.

## Regole di prodotto
Nessuna decisione di `02_APERTI.md` è risolta implicitamente dal modello dati o dal merge. Priorità a `01_DECISIONI.md`.
