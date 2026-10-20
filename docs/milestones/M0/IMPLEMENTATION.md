# M0 — Implementazione

## Codice
- App Router Next.js 16, TypeScript strict, React 19.
- `src/app`: homepage, login, callback Auth, console vuota, health endpoint, robots disallow.
- `src/components`: Brand, WorkspaceShell con menu canonici (7/5/7).
- `src/lib/supabase`: client browser/server tramite `@supabase/ssr`; proxy aggiornamento sessione; controllo `getClaims()`.
- `src/lib/env.ts`: check configurazione HTTPS Supabase + publishable key. Service role mai esposta al browser.
- `src/lib/navigation.ts`: menu canonici.
- `e2e`, test Vitest, GitHub workflow CI.
- `supabase/migrations/.gitkeep`: nessun DDL applicato in M0.

## Infrastruttura verificata
GitHub pubblico `CarloG76/Memorial`; Vercel `memorial`, framework impostato su Next.js; collegamento automatico per Preview (branch `m0-bootstrap`); URL e publishable key Supabase configurati **solo** in Preview/Development e non mostrati nei commit. Supabase `ojzkikhtcrqcpsvhepbp`, PostgreSQL 17, `eu-west-1`.

## Nota sicurezza
`/console/[area]` è una shell senza dati: l'identità autenticata non autorizza l'accesso a risorse di tenant. M1 introdurrà il controllo membership prima di abilitare qualsiasi vista dati.
