# Memorial — Changelog tecnico

## 2026-10-20 — M1 (PR preparatoria, DB invariato)
- Modellati account e tenancy: profile, platform/agency/family membership, inviti, memorial UUID minimo.
- SQL migrazione additiva da revisionare e testare su staging, RLS fail-closed e funzioni nel solo schema privato.
- Console protette per membership reale; selettore neutro e API versione 1 per aree autorizzate.
- Test negativi codificati; nessuna migrazione live applicata.

## 2026-10-20 — M0 (in validazione)
- Inizializzato Next.js / React / TypeScript su branch M0.
- Impostato design system navy/avorio/oro e shell 7/5/7.
- Predisposta autenticazione Supabase SSR, guard di base, CI ed endpoint health.
- Vercel configurato su Next.js e Preview compilata READY.
- Correzione CI: caching pnpm temporaneamente disattivato in assenza di lockfile.
- Nessuna migrazione o dato demo applicato.
