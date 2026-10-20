# M0 — Evidenze di verifica

Verifica effettuata il **20 ottobre 2026**.

| Oggetto | Evidenza | Stato |
|---|---|---|
| Repository | GitHub `CarloG76/Memorial`, main iniziale solo README | VERIFICATO |
| Supabase | progetto attivo, schema `public` senza tabelle, elenco migrazioni vuoto | VERIFICATO |
| Vercel primo build | preview errore `STATIC_BUILD_NO_OUT_DIR`: progetto configurato come statico | VERIFICATO / CORRETTO |
| Vercel secondo build | deployment `dpl_AZjK8TfudmDCB3qErWjtqgZhFaxj` stato `READY`, commit `cec5161`, Next.js | VERIFICATO |
| GitHub Actions prima run | run 39462158036 fallita su `setup-node cache: pnpm` per assenza `pnpm-lock.yaml` | VERIFICATO / FIX IN PR |
| Unit/integration/E2E | non ancora eseguiti con esito positivo in GitHub Actions | NON VERIFICATO |
| Lockfile | non presente, da generare e versionare | APERTO |
| Runtime Auth | config pubblicabile impostata; test di login con utente verificato non ancora eseguito | NON VERIFICATO |
| DDL/dummy/payments | nessuno eseguito | VERIFICATO |

Un deployment READY attesta la compilazione e la distribuzione; **non** dimostra di per sé test funzionali, RLS o autorizzazione.
