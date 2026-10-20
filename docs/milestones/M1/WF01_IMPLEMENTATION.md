# M1 / WF01 — Agenzia Free

Implementazione candidata, documentata il 20/10/2026. Schema non applicato in Supabase operativo.

Percorso: credenziali -> conferma email Supabase -> onboarding verificato -> condizioni B2B pubblicate e accettate -> creazione atomica agency FREE e agency owner.

La RPC complete_agency_registration è riservata agli utenti autenticati, controlla la mail verificata nel database Auth, valida la P.IVA italiana anche sul server SQL e richiede due documenti ufficiali attivi: condizioni B2B e informativa privacy, versionati. Indice univoco su partita IVA impedisce doppia società; una seconda richiesta dello stesso owner è idempotente. Ogni consenso contrattuale viene registrato in una tabella senza accesso diretto al browser.

Nessun documento legale o account SuperAdmin viene creato automaticamente. Finché l'informativa e le condizioni non sono state approvate e pubblicate, il flusso rimane non attivabile. La migrazione necessita test PostgreSQL e Auth/PostgREST prima dell'applicazione operativa.
