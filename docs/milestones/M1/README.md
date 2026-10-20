# M1 — Identity, Tenancy e registrazione B2B

**Situazione al 21/10/2026:** schema M1 e WF01 applicati nel progetto Supabase Memorial. La registrazione resta disabilitata fino alla pubblicazione delle condizioni B2B e alla verifica email. Nessun utente o agenzia reale creato in questa attività.

Tre migrazioni applicate oltre all'hardening RLS preesistente: `20261020220618`, `20261020220643`, `20261020220855`. L'ultima sposta la funzione privilegiata nello schema `app_private` e rende il wrapper pubblico `SECURITY INVOKER`.

**Verificato live:** nove tabelle, tutte con RLS; anon privo di SELECT; authenticated privo di INSERT/UPDATE diretti; funzione RPC pubblica invoker e non eseguibile da anon. Due linter INFO su tabelle senza policy deliberate. **Da verificare:** test CI PostgreSQL, test fra due tenant con dati sintetici in staging e sessioni Supabase Auth reali.

Dettagli: [registro](VERIFICATION.md), [WF01](WF01_IMPLEMENTATION.md), [sicurezza](SECURITY_REVIEW.md), [questioni aperte](OPEN_ISSUES.md).
