# M1 — Problemi e gate ancora aperti

1. Eseguire e raccogliere **prova positiva** del job CI PostgreSQL `postgres-rls`; l'esito non è disponibile nel connettore che filtra le workflow run al contesto PR.
2. Test RLS **con JWT Supabase realmente firmati**, due agenzie e famiglie diverse, in ambiente isolato: non ancora completato.
3. SuperAdmin: account personale e MFA da creare/provisionare con autorizzazione dell'interessato; mai self-registration come platform OWNER.
4. Documenti B2B e informativa privacy: mancanti; non attivare il gate di registrazione senza versioni approvate e URL pubblici validi.
5. Auth callback, deliverability email, rate limiting e anti-abuso: test reali ancora mancanti.
6. Recensionare la scelta SECURITY DEFINER nello schema privato con wrapper invoker, registrazione audit e limiti ad utenti verificati.
7. Adeguare comportamento UI in caso di agenzia sospesa, revisionare contract/legal acceptance e contatti privacy.

**Chiusi:** schema M1 applicato, policy RLS abilitate, permessi SQL anon e client verficati, RPC privilegiata isolata, migrazioni GitHub rinominate con ID remote effettivi.
