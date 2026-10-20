# M1 — Identity & Tenancy

**Origine storica:** PR [#2](https://github.com/CarloG76/Memorial/pull/2), consolidata su `main` con commit squash `afc3acc7` il 20 ottobre 2026. Da M2 vale lo sviluppo ordinario diretto su `main`.

**Ambito codice:** modelli profili/membership, migrazione candidata con RLS fail-closed, accessi SSR alla console, endpoint `/api/v1/me`.
**Stato:** CODICE IN `main` E CI VERIFICATA. **DB NON MIGRATO / RLS NON COLLAUDATE IN POSTGRES.**

La migrazione candidata definisce profili, ruoli piattaforma, agenzie e membership, un memoriale UUID minimo, appartenenze famiglia e inviti con token hash. Non sono attivi pagamenti o dati privati.

GitHub Actions [39475813862](https://github.com/CarloG76/Memorial/actions/runs/39475813862) superata sulla revisione pre-merge `a26f1da3`. Successivo deploy main da verificare separatamente.

**Gate operativo:** test RLS cross-tenant su database isolato con due agenzie, famiglie owner/editor/viewer, anonimo e diversi ruoli piattaforma. Non applicare migrazioni al DB live prima del controllo completo, né attivare console dati in assenza delle policy. L'integrazione del solo codice non costituisce attestazione di sicurezza delle RLS.
