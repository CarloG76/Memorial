"use client";

import {useState} from "react";
import {AgencyFreeBalance} from "./agency-free-memorial";
import "./agency-administration.css";
import {memorialStateLabel,agencyStatusLabel} from "@/lib/memorial-states";
import {AgencyDemoCheckout} from "./agency-demo-checkout";

export type AdministrationAgency={
 id:string;legal_name:string;city:string|null;plan:string;status:string;is_demo:boolean;
 vat_number?:string|null;contact_email?:string|null;
};
export type AdministrationMemorial={
 id:string;agency_id?:string;name?:string|null;deceased_name?:string|null;
 tier?:string|null;status:string;is_demo:boolean;demo_code?:string|null;
};
// Nuovo listino B2B 2026. Premium +3 EUR ancora da confermare contrattualmente.
const prices={
 PAYG:{standard:"€ 19,90",premium:"€ 22,90"},
 MONTHLY:{standard:"€ 13,90",premium:"€ 16,90"},
 YEARLY:{standard:"€ 11,90",premium:"€ 14,90"}
} as const;
const format=(value:string)=>["ACTIVE","CLOSED","SUSPENDED"].includes(value)?agencyStatusLabel(value):memorialStateLabel(value);
function metric(value:string|number,label:string,detail?:string){
 return <div className="agency-admin-metric"><strong>{value}</strong><span>{label}</span>{detail&&<small>{detail}</small>}</div>;
}
function csvCell(v:unknown){
 const text=String(v??"");
 // Prevent Excel/Sheets from evaluating agency-controlled text as a formula.
 const safe=/^[\s]*[=+\-@]/.test(text)?"'"+text:text;
 return '"'+safe.replaceAll('"','""')+'"';
}
export function AgencyAdministration({agency,memorials,contextKey=null}:{agency:AdministrationAgency;memorials:AdministrationMemorial[];contextKey?:string|null}){
 const [exportError,setExportError]=useState("");
 const ours=memorials.filter(m=>m.agency_id===undefined||m.agency_id===agency.id);
 const pro=agency.plan==="PRO";

 const published=ours.filter(m=>m.status==="PUBLISHED_ACTIVE").length;
 const pending=ours.filter(m=>["DRAFT","PAYMENT_PENDING","SKELETON_ACTIVE","FAMILY_PREPARING","READY_FOR_PUBLICATION"].includes(m.status)).length;
 function exportInventory(){
  try{
   const rows=[["Memoriale","Codice demo","Tipo","Stato","Dati demo"],
    ...ours.map(m=>[m.name??m.deceased_name??"",m.demo_code??"",m.tier??"",format(m.status),m.is_demo?"Sì":"No"])];
   const csv="\uFEFF"+rows.map(row=>row.map(csvCell).join(";")).join("\r\n");
   const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
   const url=URL.createObjectURL(blob);
   const link=document.createElement("a");link.href=url;link.download="memoriali-agenzia-"+agency.id.slice(0,8)+".csv";
   document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
   setExportError("");
  }catch{setExportError("Esportazione non riuscita. Riprova.");}
 }
 return <div className="agency-admin">
  <header className="agency-admin-heading">
   <div><span className="workspace-label">AGENZIA / AMMINISTRAZIONE</span><h1>Amministrazione</h1>
    <p>{agency.legal_name} · {agency.is_demo?"Dati dimostrativi":"Dati agenzia"} · {format(agency.status)}</p></div>
   <span className={"agency-admin-plan "+(pro?"pro":"free")}>{agency.is_demo?"Agenzia DEMO · piano contrattuale "+agency.plan:"Piano "+agency.plan}</span>
  </header>
  <div className="agency-admin-summary">
   {metric(agency.plan,"Piano attuale",pro?"Periodicità da verificare":"Nessun canone")}
   {metric(ours.length,"Memoriali associati","Dati correnti")}
   {metric(published,"Pubblicati")}
   {metric(pending,"In preparazione / pagamento")}
  </div>
  <div className="agency-admin-columns">
   <section className="agency-admin-card">
    <h2>Memoriali gratuiti e prezzi</h2>
    {!agency.is_demo&&<AgencyFreeBalance agencyId={agency.id}/>}
    <p className="agency-admin-muted">Il piano visualizzato è quello effettivamente assegnato all&apos;agenzia. Non è indicativo di un pagamento verificato.</p>
    <dl className="agency-admin-terms">
     <div><dt>Primi due memoriali per nuova agenzia</dt><dd>Gratuiti una sola volta</dd></div>
     <div><dt>Senza abbonamento · Standard</dt><dd>{prices.PAYG.standard}</dd></div>
     <div><dt>Senza abbonamento · Premium*</dt><dd>{prices.PAYG.premium}</dd></div>
     <div><dt>Pro mensile · Canone</dt><dd>€ 39,90 / mese</dd></div>
     <div><dt>Pro mensile · Standard / Premium*</dt><dd>{prices.MONTHLY.standard} / {prices.MONTHLY.premium}</dd></div>
     <div><dt>Pro annuale · Canone</dt><dd>€ 379 / anno</dd></div>
     <div><dt>Pro annuale · Standard / Premium*</dt><dd>{prices.YEARLY.standard} / {prices.YEARLY.premium}</dd></div>
    </dl>
    <div className="agency-admin-note">
     <p>Ogni memoriale aggiuntivo si paga singolarmente, anche con Pro. <strong>Non esistono crediti mensili.</strong> I due memoriali gratuiti iniziali non si rinnovano.</p>
    </div>
    <p className="agency-admin-muted">*Sovrapprezzo Premium di € 3 proposto, ancora da approvare. IVA da definire. Le attivazioni e il piano demo vengono salvati nel database DEMO; gli importi demo non sono fatture.</p>
    <p className="agency-admin-muted">{agency.is_demo?"Qui sotto puoi confermare piani e creare memoriali veri con pagamenti simulati; la scelta del piano DEMO è separata dal contratto.":"Attivazione abbonamento, checkout Stripe, rinnovo automatico, disdetta e fatture saranno disponibili soltanto dopo integrazione e verifiche."}</p>
   </section>
   <section className="agency-admin-card">
    <h2>Riepilogo amministrativo</h2>
    <dl className="agency-admin-terms">
     <div><dt>Ragione sociale</dt><dd>{agency.legal_name}</dd></div>
     <div><dt>Partita IVA</dt><dd>{agency.vat_number||"Non disponibile in questa vista"}</dd></div>
     <div><dt>Sede / Città</dt><dd>{agency.city||"Non indicata"}</dd></div>
     <div><dt>Email contatto</dt><dd>{agency.contact_email||"Non disponibile in questa vista"}</dd></div>
    </dl>
    <h3>Conservazione dei memoriali</h3>
    <p>Un anno incluso; durata complessiva di 3 anni € 12, 5 anni € 18, 10 anni € 30. Questi sono prezzi di listino, non addebiti registrati.</p>
    <p className="agency-admin-muted">La chiusura o il downgrade dell&apos;agenzia non terminano i periodi di conservazione già pagati.</p>
   </section>
  </div>
  <AgencyDemoCheckout agencyId={agency.id} agencyName={agency.legal_name} isDemo={agency.is_demo} contextKey={contextKey}/>
  <section className="agency-admin-card">
   <div className="agency-admin-card-head"><div><h2>Memoriali e documentazione</h2><p>Inventario dell&apos;agenzia, esportabile per controllo interno.</p></div>
    <button type="button" className="agency-admin-export" onClick={exportInventory}>Esporta CSV</button></div>
   {exportError&&<p role="alert">{exportError}</p>}
   <div className="agency-admin-table-wrap"><table><thead><tr><th>Memoriale</th><th>Prodotto</th><th>Stato</th><th>Tipo dati</th></tr></thead>
    <tbody>{ours.map(m=><tr key={m.id}><td>{m.name??m.deceased_name??"In preparazione"}</td><td>{m.tier??"—"}</td><td>{format(m.status)}</td><td>{m.is_demo?"Demo":"Reale"}</td></tr>)}</tbody></table>
   </div>
   {ours.length===0&&<p className="agency-admin-muted">Non sono presenti memoriali associati.</p>}
   <div className="agency-admin-empty"><h3>Pagamenti e fatture</h3>
    <p>Non sono ancora disponibili fatture, movimenti bancari o ricevute verificati. Non presentiamo importi fittizi né presumiamo che i memoriali risultino pagati.</p></div>
  </section>
 </div>;
}
