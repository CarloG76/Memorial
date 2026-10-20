# Registro delle milestone — MEMORIAL

Questa directory è il registro tecnico persistente del progetto.

Per ogni milestone `Mxx` sono previsti:
- `README.md`: obiettivo, ambito, requisiti collegati, criteri di accettazione.
- `IMPLEMENTATION.md`: file modificati, codice, integrazioni, scelte tecniche.
- `VERIFICATION.md`: prove effettivamente eseguite (timestamp, ambiente, risultato, commit).
- `OPEN_ISSUES.md`: problemi, rischi, decisioni bloccanti, possibili interventi successivi.
- `ROLLBACK.md`: procedura concreta per annullare la modifica in sicurezza.

Distinguere sempre **IMPLEMENTATO**, **VERIFICATO** e **NON VERIFICATO**.
Non dichiarare una milestone chiusa senza build, test e verifica accettazione.
Le decisioni business restano governate da `01_DECISIONI.md` nelle fonti e questioni aperte da `02_APERTI.md`; questi report non possono modificarle.

Convenzioni: feature branch dedicato, PR, migrazioni additive numerate, test automatici e release preview; produzione solo dopo accettazione esplicita.
