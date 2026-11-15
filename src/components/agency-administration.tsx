"use client";

import {useState} from "react";
import "./agency-administration.css";

export type AdministrationAgency={
 id:string;legal_name:string;city:string|null;plan:string;status:string;is_demo:boolean;
 vat_number?:string|null;contact_email?:string|null;
};
export type AdministrationMemorial={
 id:string;agency_id?:string;name?:string|null;deceased_name?:string|null;
 tier?:string|null;status:string;is_demo:boolean;demo_code?:string|null;
};
const prices={FREE:{standard:"€ 5,90",premium:"€ 9,90",allowance:"Nessuno",operators:"1"},
 PRO:{standard:"€ 3,90",premium:"€ 5,90",allowance:"3 crediti Standard/mese",operators:"5"}} as const;
const statusLabels:Record<string,string>={
 ACTIVE:"Attiva",CLOSED:"Chiusa",SUSPENDED:"Sospesa",
 DRAFT:"Bozza",PAYMENT_PENDING:"Pagamento in attesa",SKELETON_ACTIVE:"Skeleton attivo",
 FAMILY_PREPARING:"In preparazione",READY_FOR_PUBLICATION:"Pronto per pubblicazione",
 PUBLISHED_ACTIVE:"Pubblicato",PRESERVED_STATIC:"Conservato",
 EXPIRED:"Scaduto",UNPUBLISHED_ARCHIVED:"Archiviato non pubblicato"
};
const format=(value:string)=>statusLabels[value]??value.replaceAll("_"," ").toLowerCase();
function metric(value:string|number,label:string,detail?:string){
 return <div className="agency-admin-metric"><strong>{value}</strong><span>{label}</span>{detail&&<small>{detail}</small>}</div>;
}
function csvCell(v:unknown){
 const text=String(v??"");
 // Prevent Excel/Sheets from evaluating agency-controlled text as a formula.
 const safe=/^[\s]*[=+\-@]/.test(text)?"'"+text:text;
 return '"'+safe.replaceAll('"','""')+'"';
}
export function AgencyAdministration({agency,memorials}:{agency:AdministrationAgency;memorials:AdministrationMemorial[]}){
 const [exportError,setExportError]=useState("");
 const ours=memorials.filter(m=>m.agency_id===undefined||m.agency_id===agency.id);
 const pro=agency.plan==="PRO";
 const policy=prices[pro?"PRO":"FREE"];
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
   <span className={"agency-admin-plan "+(pro?"pro":"free")}>Piano {agency.plan}</span>
  </header>
  <div className="agency-admin-summary">
   {metric(agency.plan,"Piano attuale",pro?"Pro — vedi condizioni sotto":"Free — senza canone")}
   {metric(ours.length,"Memoriali associati","Dati correnti")}
   {metric(published,"Pubblicati")}
   {metric(pending,"In preparazione / pagamento")}
  </div>
  <div className="agency-admin-columns">
   <section className="agency-admin-card">
    <h2>Abbonamento e condizioni</h2>
    <p className="agency-admin-muted">Il piano visualizzato è quello effettivamente assegnato all'agenzia. Non è indicativo di un pagamento verificato.</p>
    <dl className="agency-admin-terms">
     <div><dt>Piano corrente</dt><dd>{agency.plan}</dd></div>
     <div><dt>Prezzo Standard</dt><dd>{policy.standard}</dd></div>
     <div><dt>Prezzo Premium</dt><dd>{policy.premium}</dd></div>
     <div><dt>Crediti inclusi</dt><dd>{policy.allowance}</dd></div>
     <div><dt>Operatori previsti dal piano</dt><dd>{policy.operators}</dd></div>
    </dl>
    <div className="agency-admin-note">
     {pro?<p>Listino Pro: <b>€ 39,90/mese</b> oppure <b>€ 379/anno</b>. I 3 crediti Standard mensili non si accumulano; possono scontare un Premium di € 3,90. Il saldo effettivo non è ancora consultabile.</p>:
      <p>Il piano Free non prevede canone. Il passaggio a Pro sarà disponibile dopo l'attivazione del checkout e della gestione delle richieste di cambio piano.</p>}
    </div>
    <p className="agency-admin-muted">Cambio piano, periodo di rinnovo, metodo di pagamento e crediti residui: non ancora collegati ai sistemi di pagamento.</p>
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
    <p className="agency-admin-muted">La chiusura o il downgrade dell'agenzia non terminano i periodi di conservazione già pagati.</p>
   </section>
  </div>
  <section className="agency-admin-card">
   <div className="agency-admin-card-head"><div><h2>Memoriali e documentazione</h2><p>Inventario dell'agenzia, esportabile per controllo interno.</p></div>
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
