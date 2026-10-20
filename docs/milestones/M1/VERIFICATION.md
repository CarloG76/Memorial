# M1 — Verifiche effettive al 21/10/2026

| Oggetto | Evidenza | Risultato |
|---|---|---|
| Database operativo | `ojzkikhtcrqcpsvhepbp` | 9 tabelle applicative presenti |
| Migrazione baseline | `20261020220618_m1_identity_tenancy` | APPLICATA |
| Migrazione onboarding | `20261020220643_m1_agency_onboarding` | APPLICATA |
| Isolamento RPC | `20261020220855_m1_private_agency_registration_rpc` | APPLICATA |
| RLS su nove tabelle | Catalogo `pg_class.relrowsecurity` | 9/9 true |
| SELECT anon su nove tabelle | `has_table_privilege('anon',…,'SELECT')` | 0/9 consentiti |
| INSERT/UPDATE authenticated diretti | `has_table_privilege` | 0/9 consentiti |
| Onboarding RPC anon | `has_function_privilege` | NEGATO |
| Onboarding RPC pubblico | `pg_proc.prosecdef` | false (SECURITY INVOKER) |
| Implementazione privata | `app_private.complete_agency_registration` | SECURITY DEFINER, eseguibile da authenticated per il wrapper |
| Supabase security advisor | POST-migrazione | 0 warning, 2 info per tabelle intenzionalmente senza policy |
| Auth users, agenzie, documenti B2B | Nessun seed o provisioning | Nessun dato creato dalla milestone |
| PostgreSQL CI transazionale e test cross-tenant | Job `postgres-rls` | DA CONFERMARE: strumenti GitHub non espongono la run push |
| Sessioni Auth / invii email reali | Non eseguiti | NON VERIFICATO |
| Pubblicazione condizioni B2B | Documenti non approvati | NON ATTIVATA |

Il deploy Vercel READY prova la compilazione, non sostituisce test di segregazione con token firmati. Per i linter INFO vedere [revisione di sicurezza](SECURITY_REVIEW.md).

## Dashboard operative
- Commit `895aecec`: viste iniziali per Agenzia, Famiglia e Piattaforma con dati di appartenenza letti sotto RLS server-side.
- Vercel Production `dpl_2Dx7jmUorABoUi7qXCvExLLnA1mJ`: stato READY, verificato sul commit esatto.
- Test interattivi con identità autentiche: non eseguiti perché nessun utente Auth è stato creato.
- Condizioni B2B: nessun documento approvato caricato, quindi registrazione pubblica ancora disabilitata.
