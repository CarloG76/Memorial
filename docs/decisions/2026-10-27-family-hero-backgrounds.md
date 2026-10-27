# ADR — Hero del memoriale, 27 ottobre 2026

## Decisione
Il memoriale pubblico mostra sempre il ritratto della persona, sfumato sul paesaggio. Il ritratto e il paesaggio sono **due asset distinti**. La selezione del paesaggio NON appartiene al visitatore: è una funzione riservata all'area autenticata **Famiglia → Profilo e storia**.

Scelte predefinite: **Montagna, Prato, Mare, Lago, Bosco, Collina, Cielo**; inoltre **Immagine personale caricata dalla famiglia**. La selezione non sostituisce il ritratto.

## Implementato
- Immagine virtuale di Giovanni corretta nel repository in `public/images/memorial-demo-portrait.webp`, blob SHA verificato `73dc1629e0896ee49f375a4f897e1c661a5137c6`.
- Nessuna UI di selezione presente nella pagina visitatore. Il visitatore vede solo `published_preset` tramite la proiezione sanitaria della RPC pubblica.
- Area famiglia: galleria dei 7 preset, anteprima e salvataggio di una bozza tramite RPC autenticata; approvazione e pubblicazione consentite al **FAMILY_OWNER** sul memoriale già pubblicato; audit degli interventi.
- RLS: la tabella delle preferenze è leggibile solo dai familiari autorizzati; la scrittura avviene esclusivamente tramite RPC con verifica delle membership.
- Verifica SQL svolta simulando una sessione Owner in transazione, pubblicazione di `lago`, e ROLLBACK: il valore pubblico originale rimane `montagna`.

## Da completare per l'upload custom
La famiglia può scegliere e **vedere l'anteprima locale** di un JPG/PNG/WebP. L'upload definitivo è volutamente disabilitato finché non saranno presenti storage privato, autorizzazioni media, controllo MIME/dimensioni, scansione e pubblicazione dopo approvazione. L'anteprima non carica né conserva il file.

## Accettazione
Verificare con browser reale che sul desktop il ritratto compaia in primo piano a sinistra con sfumatura verso destra, sul mobile con sfumatura verso il basso; verificare che in visitor non compaia `Personalizza lo sfondo` e che in Famiglia si possano salvare/pubblicare i preset secondo il ruolo.
