# M0 — Bootstrap applicativo

**Obiettivo:** predisporre la fondazione Next.js/TypeScript con design Memorial, Supabase Auth SSR e test.
**Branch:** `m0-bootstrap` — [PR #1](https://github.com/CarloG76/Memorial/pull/1) (draft)
**Ambito:** esclusivamente codice e configurazione non distruttiva.
**Fuori ambito:** migrazioni/seed, pagamenti, dati famiglia, autorizzazioni granulari, pubblicazione visitatore.

Criteri: build Vercel Preview READY; lint/typecheck/Vitest/Playwright in CI superati; lockfile dipendenze versionato; nessun segreto committato; database invariato.
**Stato:** codebase distribuita su preview, build confermata READY; non chiusa in assenza di tutte le verifiche CI/lockfile.
