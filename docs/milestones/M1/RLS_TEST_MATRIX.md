# M1 — Matrice test RLS

Data: 20/10/2026. I test sono implementati nei file `supabase/tests/M1_*.sql`. L'esito effettivo del job GitHub Actions PostgreSQL su push `main` deve essere acquisito prima di dichiarare approvato lo schema per produzione.

| Soggetto test | Agency A | Agency B | Memorial A | Memorial B | Famiglia altrui | Write grants |
|---|---|---|---|---|---|---|
| Anonimo | Negato | Negato | Negato | Negato | Negato | Negati |
| Agency A owner | Concesso | Negato | Concesso | Negato | Negato | Negati |
| Agency B owner | Negato | Concesso | Negato | Concesso | Negato | Negati |
| Family owner A | Negato | Negato | Concesso | Negato | Negato | Negati |
| Family editor A | Negato | Negato | Concesso | Negato | Negato | Negati |
| Family viewer B | Negato | Negato | Negato | Concesso | Negato | Negati |
| Platform Admin | Anagrafica soltanto | Anagrafica soltanto | Negato | Negato | Negato | Negati |
| Finance | Negato | Negato | Negato | Negato | Negato | Negati |
| Support | Negato | Negato | Negato | Negato | Negato | Negati |

**Ulteriori invarianti testate nel file:** nessun client legge gli inviti o gli hash token; Family Editor non si assegna OWNER; un Viewer non si assegna piattaforma OWNER; indice `platform_one_active_owner` impedisce due SuperAdmin attivi.

Questa matrice è la previsione delle autorizzazioni scelte in M1 e non equivale ancora all'approvazione delle capability di lettura dettagliata: le API successive devono applicare il ruolo per azione, verificare tenant e stato risorsa, auditare le operazioni forti e mantenere la privacy familiare. In particolare l'accesso privilegiato staff a contenuti privati non è consentito dalla vista generica.

## Ambiente di prova
GitHub Actions job `postgres-rls`: database PostgreSQL 17 effimero, schema `auth` emulato, utenti UUID sintetici, `SET LOCAL ROLE` non superuser, claim `sub` variato ad ogni prova. **Non è il database Supabase Memorial**, non richiede una nuova sottoscrizione e non scrive dati reali.

## Gate prima della migrazione live
1. Esito SQL CI confermato via GitHub Actions (non solo Vercel).
2. Schema/RLS review, indici, grant, funzioni security definer.
3. Verifiche Auth/PostgREST con JWT firmati e account di test in ambiente autorizzato.
4. Decisione esplicita su operazioni eventualmente irreversibili e piano di rollback.
