# MEMORIAL — Registro delle milestone

La directory registra gli sviluppi previsti dalla documentazione ufficiale. **Da M2 si implementa direttamente su `main`** con CI e deploy Vercel principale; per richieste extra e integrazioni isolate utilizzare branch `feature/*` e `docs/features/`.

Per ogni `Mxx`:
- `README.md` — ambito, requisiti ufficiali, stato e criteri di accettazione.
- `IMPLEMENTATION.md` — file, moduli, database, dipendenze, decisioni tecniche.
- `VERIFICATION.md` — test realmente eseguiti, commit, run CI, target Vercel, SQL/RLS.
- `OPEN_ISSUES.md` — blocchi, rischi, decisioni non prese e prossimo passo.
- `ROLLBACK.md` — recupero applicativo e dati, senza operazioni distruttive automatiche.

Ogni modifica aggiorna il changelog. Non dichiarare collaudata una parte solo perché CI o build è verde: le autorizzazioni richiedono test RLS e gli incassi richiedono test di webhook e riconciliazione.

**Precedenza:** `01_DECISIONI.md` è prevalente in materia di prodotto/business; `02_APERTI.md` contiene questioni irrisolte. La regola git vive in `docs/DEVELOPMENT_WORKFLOW.md`. M0 e M1 sono stati consolidati da PR storiche; non è il modello da ripetere per le milestone ordinarie.
