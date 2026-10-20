# MEMORIAL — Workflow di sviluppo approvato

**Decisione operativa: 20/10/2026.** Questa è una regola di gestione del codice, non modifica nessuna regola business. `01_DECISIONI.md` rimane la fonte prevalente per i requisiti; `02_APERTI.md` contiene le questioni non decise.

## Branch principale: main

`main` è il ramo canonico del codice e il branch collegato al deployment principale Vercel (`memorial`). Per tutti i lavori **già compresi nelle specifiche approvate**, lo sviluppo si svolge direttamente su `main`, per commit atomici e riferiti alla milestone corretta.

- Non apriamo un branch solo perché inizia una nuova milestone M2, M3, M4 ecc.
- Il codice, la migrazione SQL *candidata* e la documentazione della milestone vivono su `main`, sotto `docs/milestones/Mx/`.
- Ogni commit deve lasciare `main` compilabile; test e lint devono essere rieseguiti tramite GitHub Actions.
- Un push su `main` avvia automaticamente il deployment principale Vercel; perciò funzionalità incomplete rimangono *non esposte*, disabilitate o senza endpoint attivi. Non considerare l'esito Vercel READY una prova dei test RBAC, RLS o business.
- Le modifiche SQL sono versionate ma si applicano soltanto dopo verifica dello schema effettivo, test su database isolato, review sicurezza e autorizzazione per operazioni potenzialmente impattanti; nessuna esecuzione indiscriminata degli SQL preliminari.
- Mai credenziali o dati personali nel repository (che è pubblico), nei log dei build o nella chat.

## Branch dedicati: richieste extra e moduli da isolare

Quando il proprietario richiede una funzionalità **aggiuntiva rispetto alla documentazione**, una variante sperimentale oppure un'integrazione che vuole testare isolatamente, si crea un branch partendo dall'HEAD attuale di `main`:

- `feature/<nome-breve>` per nuove funzionalità, namespace/aree, integrazioni isolate.
- `fix/<nome-breve>` quando una correzione richiede isolamento.
- `feature/stripe-payments` è il caso esemplificativo richiesto: anche se la parte pagamenti è prevista nelle specifiche, viene sviluppata e testata su branch separato.

Il branch contiene codice **e** documentazione `docs/features/<slug>/` (richiesta, delta rispetto alle decisioni, file/endpoint/schema, test, rischi e rollback). Ogni branch riceve una Preview Vercel protetta. Quando i test tecnici, di sicurezza e funzionali pertinenti sono superati e il proprietario accetta le eventuali decisioni business rimaste aperte, la modifica è integrata con PR in `main`. Dopo il merge si verifica il deployment principale e si aggiorna il registro.

### Stripe / pagamenti (esempio concreto)
Su `feature/stripe-payments` usiamo esclusivamente Stripe test mode, webhook firmati, idempotenza, verifiche pagamento/ordine e autorizzazioni. La Preview non deve processare transazioni reali. L'attivazione delle modalità live (e le conseguenti fatture e pagamenti) è una decisione separata da merge/CI, da richiedere esplicitamente.

## Documentazione continua

```
docs/
  DEVELOPMENT_WORKFLOW.md
  CHANGELOG.md
  milestones/
    M0/{README,IMPLEMENTATION,VERIFICATION,OPEN_ISSUES,ROLLBACK}.md
    M1/{README,IMPLEMENTATION,VERIFICATION,OPEN_ISSUES,ROLLBACK}.md
    M2/...
  features/
    README.md
    FEATURE_TEMPLATE.md
    <slug>/{SPEC,IMPLEMENTATION,TESTS,ROLLBACK}.md
```

Per ogni commit/integrazione annotare: data, milestone o feature, commit SHA, repository/branch, esiti CI, deployment Vercel (ambiente, URL, stato), impatto su database/RLS, test effettivi, problemi aperti, decisioni e rollback. Distinguere sempre `CODIFICATO`, `TESTATO`, `MERGED`, `DEPLOYED`, `ATTIVO`. Non trattare queste condizioni come equivalenti.

## Situazione di partenza della regola

Le PR storiche M0 [#1](https://github.com/CarloG76/Memorial/pull/1) e M1 [#2](https://github.com/CarloG76/Memorial/pull/2) sono state integrate in `main`. Sono operazioni una tantum di consolidamento: da M2 lo sviluppo previsto dalla documentazione avviene direttamente su `main`.

M1 contiene una proposta di migrazione e un'implementazione degli accessi; **nessuna migrazione M1 è stata applicata nel Supabase operativo** alla data della decisione. In assenza delle tabelle, l'autorizzazione delle console fallisce senza esporre dati. Test cross-tenant su PostgreSQL ancora mancanti.
