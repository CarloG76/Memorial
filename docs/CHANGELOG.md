# Memorial — Changelog tecnico

## 2026-10-20 — M1, verifica RLS e gestione sessioni su main
- Job PostgreSQL 17 temporaneo nella CI per applicare e verificare la migrazione M1 senza toccare il database Supabase.
- Test anon/agency A/B/family owner/editor/viewer/platform admin/finance/support, con tentativi di escalation e protezione inviti.
- Capability familiari applicate secondo le specifiche (owner esclusivo per pubblicazione e deleghe; editor soltanto con permessi espliciti).
- Logout server-side e rifiuto dell'accesso di account email non verificati.
- Nessun account, dato reale o pagamento attivato.

## 2026-10-20 — Workflow di sviluppo main + feature branches
- `main`: funzionalità comprese nella documentazione canonica.
- `feature/*`: **tutte** le richieste fuori specifica (non solo Stripe), test Preview e merge dopo collaudo.

## 2026-10-20 — M1 codice integrato
- PR #2 integrata su `main` con schema candidato e guard SSR. Migrazione DB ancora non applicata.

## 2026-10-20 — M0
- PR #1, Next.js/TypeScript, design responsive, Supabase SSR, GitHub CI, Vercel Production.
