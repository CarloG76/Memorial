# M2.1 — Esecuzione provisioning accessi UAT

**Codice implementato:** `scripts/provision-uat.mjs`

## Risultato atteso
Crea con Supabase Auth Admin API:
- SuperAdmin `gonella.carlo@gmail.com`, ruolo piattaforma OWNER.
- Gli otto account demo specificati in `11_DUMMY_GUIDA.md`, marcati in Auth `app_metadata.memorial_demo=true`.
- Profili, appartenenze Agenzia/Famiglia e capability, sulle 3 agenzie e 12 memoriali persistenti.

Account preesistenti: non cambia password, non assume il loro controllo; rifiuta collisioni con account non-demo. Si arresta se esistono già OWNER non riconosciuti.

## Ambiente sicuro
Il comando deve essere eseguito **localmente** in ambiente amministrativo (non su Vercel, non in GitHub Actions e non tramite API pubbliche). Solo queste variabili devono essere presenti nel processo:

```text
SUPABASE_URL=            # URL https progetto approvato
SUPABASE_SECRET_KEY=     # server secret/service-role, MAI NEXT_PUBLIC_
MEMORIAL_OWNER_INITIAL_PASSWORD= # valore condiviso dal titolare, in secret store
MEMORIAL_DEMO_INITIAL_PASSWORD=  # valore condiviso dal titolare, in secret store
MEMORIAL_PROVISION_APPROVED=YES
```

Non scrivere i valori segreti in shell history, commit, log o documenti. Utilizzare secret manager o caricamento interattivo. Eseguire:

```sh
pnpm install --frozen-lockfile
node scripts/provision-uat.mjs
```

Il connettore Supabase ChatGPT attualmente permette SQL/DDL ma **non espone Auth Admin createUser**, né fornisce una chiave secret server; questa esecuzione non può essere considerata effettuata tramite connettore.

## Verifica dopo esecuzione
1. Authentication → Users: nove utenti confermati.
2. `platform_memberships`: un OWNER reale corrispondente all'email SuperAdmin.
3. `agency_members`: quattro associazioni (A03 disattivata).
4. `family_members`: dieci associazioni.
5. Login reale, sessione, logout, e prova negativa cross-tenant.
6. Cambio password immediato del SuperAdmin dopo il primo accesso, e successiva disabilitazione delle password provvisorie condivise.

## Avvertenze
Gli account `@memorial-test.example` non hanno recapito reale per recupero credenziali: sono esclusivamente fixture. La conferma in Auth è amministrativa. Un'unica password demo condivisa è tollerata solo per collaudo temporaneo e non può essere riutilizzata in produzione.
