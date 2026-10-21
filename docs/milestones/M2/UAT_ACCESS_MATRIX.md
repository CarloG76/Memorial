# MEMORIAL — Piano di collaudo accessi (UAT)

**Stato 21/10/2026:** account NON ANCORA PROVISIONATI. Non confondere la lista specifica con credenziali esistenti. Supabase attualmente non contiene utenti Auth. Il connettore disponibile non espone la creazione utenti tramite Auth Admin API.

## Matrice dei nove accessi richiesti
| Codice | Email utente | Ruolo | Ambito | Cosa verificare |
|---|---|---|---|---|
| U00 | Email reale del titolare, da confermare in Auth | OWNER piattaforma (SuperAdmin) | 3 agenzie / 12 memoriali demo | /console/piattaforma, indicatori, filtro per agenzia |
| U01 | owner.aurora@memorial-test.example | OWNER agenzia | Aurora, M01–M06 | /console/agenzia: 6 memoriali, PRO |
| U02 | operatore.aurora@memorial-test.example | OPERATOR agenzia | Aurora, M01–M06 | Stessa agenzia; nessun potere OWNER |
| U03 | owner.quiete@memorial-test.example | OWNER agenzia | La Quiete, M07–M09 | 3 memoriali, FREE |
| U04 | owner.ricordo@memorial-test.example | OWNER agenzia disattivata | Il Ricordo, M10–M12 | Nessuna operazione su agenzia CLOSED |
| U05 | laura.rossi@memorial-test.example | FAMILY_OWNER | M01–M02 | Gestione familiare Rossi |
| U06 | marco.rossi@memorial-test.example | FAMILY_EDITOR + can_moderate | M01–M02 | Moderazione dei pensieri |
| U07 | anna.bianchi@memorial-test.example | FAMILY_OWNER | M07–M09 | Solo Bianchi |
| U08 | elena.verdi@memorial-test.example | FAMILY_OWNER | M10–M12 | Solo Verdi |

Le email `@memorial-test.example` sono identificativi di specifica e non caselle recapitabili. Per eseguire login con email confermata occorrono identità Auth gestite attraverso Supabase Dashboard/Admin e recapiti di prova effettivamente utilizzabili oppure una configurazione Auth di test che supporti utenti preconfermati.

## Password e consegna
- **Nessuna password è stata generata o impostata.**
- Non pubblicare credenziali in questo repository (pubblico), nel report o negli script SQL.
- Le password temporanee devono essere generate al provisioning, consegnate fuori GitHub tramite canale sicuro e sostituite al primo accesso.
- Quando gli utenti saranno effettivamente attivi, consegnare all'UAT un file riservato con ambiente, URL, login, password iniziale e data di scadenza; non committare quel file.

## Evidenza richiesta per spuntare la consegna
- 9 account effettivamente presenti in Supabase Auth, 9 identità con email verificata, zero password nel DB applicativo/GitHub.
- Ruoli e membership DB riferiti agli Auth UUID autentici, con flag demo coerente.
- Prova login/logout e isolamento cross-tenant per tutti e nove gli utenti.
- Percorsi UI realmente cliccabili e risultati verificati; documentare quali funzioni non sono ancora implementate.
- CI, Preview Vercel e security checks verdi.

## Passo tecnico da realizzare
1. Attivare flusso autorizzato di provisioning Auth (Supabase Admin API/Dashboard) e una casella/catch-all di test.
2. Creare e verificare il SuperAdmin reale con il suo indirizzo; assegnare OWNER solo via bootstrap privilegiato auditato.
3. Creare gli otto utenti demo via Auth Admin API (mai SQL INSERT in auth.users).
4. Collegare agency_members e family_members con script transazionale versionato basato sugli UUID effettivi.
5. Eseguire smoke test per ciascun ruolo e produrre il documento accessi riservato.

**Non dichiarare completata questa milestone prima di poter fornire credenziali funzionanti.**
