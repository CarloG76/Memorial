# M1 — Problemi residui

1. Verificare l'esito del job SQL in GitHub Actions ed eseguire correzioni finché è verde.
2. L'ambiente Supabase operativo non ha schema applicativo; nessuna migrazione verrà lanciata finché test e sicurezza non saranno rivisti.
3. Manca test reale Auth/PostgREST con utenti test verificati; serve ambiente isolato o piano di test esplicito prima di operare con utenti reali.
4. WF01 registrazione agenzia, WF04 invito/accettazione e provisioning SuperAdmin necessitano servizi server-side auditati, email e test autorizzativi.
5. Consolidare audit logging, controlli MFA staff, attivazione/sospensione ruolo e limiti tenant/permission per azione.
6. Le decisioni aperte e aspetti legali rimangono in `02_APERTI.md`; il codice CI non decide retention, export, limiti media o tariffe.
7. Le Preview Vercel rimangono protette: fetch remoto 403 fino a permessi corretti.
