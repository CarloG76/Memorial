# Memorial — Changelog tecnico

## 2026-10-20 — M2 catalogo B2B (prima tranche su main)
- Calcolatore preventivi Standard/Premium Free/Pro con durate TOTALE 1/3/5/10 anni in centesimi.
- Sconto teorico credito Pro €3,90, esplicitamente senza riserva/consumo; zero pagamento e zero attivazione.
- Preventivo riattivazione €10 + tariffa 3/5/10; bloccato 1 anno non approvato.
- Test unitari e documentazione M2; non applicate migrazioni né scritture DB.

## 2026-10-20 — M1 RLS, sessione, permessi
- PostgreSQL 17 effimero con test RLS multi-tenant in CI, candidato M1 non applicato su Supabase.
- Singleton SuperAdmin attivo a livello di indice univoco.
- Guard email verificata, logout e capability familiari testabili.

## 2026-10-20 — Workflow
- Main per specifiche approvate, feature branch dedicato per **qualsiasi** nuova richiesta fuori dalle fonti (non solo Stripe).

## 2026-10-20 — M0/M1 baseline
- Codice incorporato in `main` via PR #1 e #2; deployment Production Vercel.
