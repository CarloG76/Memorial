"use client";
import {useEffect,useMemo,useState,type FormEvent} from "react";
import "./agency-demo-checkout.css";

type Plan="PAYG"|"MONTHLY"|"YEARLY";
type Tier="STANDARD"|"PREMIUM";
type Stage="SELECT"|"CONFIRM"|"SUCCESS";
type DemoOrder={id:string;name:string;email:string;tier:Tier;plan:Plan;amount:number;date:string;kind:"MEMORIAL"|"SUBSCRIPTION"};
type DemoState={plan:Plan;freeUsed:number;orders:DemoOrder[];startedAt:string};
const fees:Record<Plan,{label:string;subscription:number;standard:number;premium:number;period:string}>={
 PAYG:{label:"Senza abbonamento",subscription:0,standard:19.90,premium:22.90,period:"Nessun rinnovo"},
 MONTHLY:{label:"Pro mensile",subscription:39.90,standard:13.90,premium:16.90,period:"Rinnovo mensile"},
 YEARLY:{label:"Pro annuale",subscription:379,standard:11.90,premium:14.90,period:"Rinnovo annuale"}
};
const money=(n:number)=>new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR"}).format(n);
function empty():DemoState{return {plan:"PAYG",freeUsed:0,orders:[],startedAt:new Date().toISOString()};}
function valid(value:unknown):value is DemoState{
 if(!value||typeof value!=="object")return false;
 const obj=value as Partial<DemoState>;
 return (obj.plan==="PAYG"||obj.plan==="MONTHLY"||obj.plan==="YEARLY")&&
 Number.isInteger(obj.freeUsed)&&Number(obj.freeUsed)>=0&&Number(obj.freeUsed)<=2&&Array.isArray(obj.orders)&&obj.orders.length<=100;
}
export function AgencyDemoCheckout({agencyId,agencyName}:{agencyId:string;agencyName:string}){
 const key="memorial:sandbox:checkout:v1:"+agencyId;
 const [model,setModel]=useState<DemoState>(empty);
 const [ready,setReady]=useState(false);
 const [choice,setChoice]=useState<Plan>("PAYG");
 const [tier,setTier]=useState<Tier>("STANDARD");
 const [person,setPerson]=useState("");
 const [email,setEmail]=useState("");
 const [stage,setStage]=useState<Stage>("SELECT");
 const [last,setLast]=useState<DemoOrder|null>(null);
 const [editingPlan,setEditingPlan]=useState(false);
 useEffect(()=>{
  try{const value=JSON.parse(window.localStorage.getItem(key)??"null") as unknown;if(valid(value)){setModel(value);setChoice(value.plan);}}
  catch{ /* local browser storage might be disabled */ }
  setReady(true);
 },[key]);
 function persist(next:DemoState){setModel(next);try{window.localStorage.setItem(key,JSON.stringify(next));}catch{/* session-only fallback */}}
 const remaining=2-model.freeUsed;
 const price=remaining>0?0:tier==="STANDARD"?fees[choice].standard:fees[choice].premium;
 const recurring=fees[choice].subscription;
 const annualFee=choice==="MONTHLY"?recurring*12:choice==="YEARLY"?recurring:0;
 const orders=useMemo(()=>model.orders.filter(o=>o.kind==="MEMORIAL"),[model.orders]);
 function selectPlan(p:Plan){setChoice(p);setEditingPlan(true);setStage("SELECT");}
 function confirmPlan(){
  if(choice===model.plan){setEditingPlan(false);return;}
  // The current subscriptions are simulated. No real contract, charge or cancellation occurs.
  const next={...model,plan:choice,orders:[...model.orders,{id:crypto.randomUUID(),name:fees[choice].label,email:"",tier:"STANDARD" as Tier,plan:choice,amount:fees[choice].subscription,date:new Date().toISOString(),kind:"SUBSCRIPTION" as const}]};
  persist(next);setEditingPlan(false);
 }
 function prepare(e:FormEvent<HTMLFormElement>){e.preventDefault();if(editingPlan||person.trim().length<3||!email.includes("@"))return;setStage("CONFIRM");}
 function pay(){
  if(editingPlan)return;
  const order:DemoOrder={id:crypto.randomUUID(),name:person.trim(),email:email.trim(),tier,plan:choice,amount:price,date:new Date().toISOString(),kind:"MEMORIAL"};
  const next:DemoState={...model,plan:choice,freeUsed:Math.min(2,model.freeUsed+(price===0?1:0)),orders:[...model.orders,order]};
  persist(next);setLast(order);setStage("SUCCESS");setPerson("");setEmail("");
 }
 function reset(){
  if(!window.confirm("Azzerare soltanto il test locale di questa agenzia? Non vengono modificati i memoriali o gli abbonamenti reali."))return;
  persist(empty());setChoice("PAYG");setLast(null);setStage("SELECT");setEditingPlan(false);
 }
 return <section className="adc-root" aria-label="Checkout dimostrativo completo">
  <div className="adc-top"><div><span className="adc-kicker">SANDBOX COMMERCIALE · NESSUN ADDEBITO</span>
   <h2>Prova il percorso di acquisto</h2><p>{agencyName} · Simulazione completa dalla selezione del piano alla conferma di ogni memoriale.</p></div>
   <button type="button" className="adc-reset" onClick={reset} disabled={!ready}>Ricomincia la demo</button></div>
  <div className="adc-summary">
   <div><strong>{ready?Math.max(0,remaining):"—"}</strong><span>Memoriali gratuiti nel test</span></div>
   <div><strong>{fees[model.plan].label}</strong><span>Piano simulato attivo</span></div>
   <div><strong>{orders.length}</strong><span>Memoriali creati nella demo</span></div>
  </div>
  <h3>1. Scegli come proseguire</h3>
  <div className="adc-plans">
   {(["PAYG","MONTHLY","YEARLY"] as Plan[]).map(p=><button type="button" key={p} onClick={()=>selectPlan(p)} className={"adc-plan "+(choice===p?"chosen":"")} aria-pressed={choice===p}>
    <span className="adc-plan-title">{fees[p].label}</span>
    <strong>{p==="PAYG"?"€0":money(fees[p].subscription)}</strong>
    <small>{p==="MONTHLY"?"/ mese · automatico":p==="YEARLY"?"/ anno · automatico":"nessun canone"}</small>
    <span className="adc-line">Standard <b>{money(fees[p].standard)}</b></span>
    <span className="adc-line">Premium* <b>{money(fees[p].premium)}</b></span>
    <span className="adc-plan-foot">{p==="PAYG"?"Paghi soltanto ciò che crei":p==="MONTHLY"?"Canone mensile + memoriali":"Canone annuale + memoriali"}</span>
   </button>)}
  </div>
  <table className="adc-table"><thead><tr><th>Condizioni</th><th>Senza abbonamento</th><th>Pro mensile</th><th>Pro annuale</th></tr></thead>
   <tbody><tr><th>Canone</th><td>€0</td><td>€39,90/mese</td><td>€379/anno</td></tr>
    <tr><th>Memoriale Standard</th><td>€19,90</td><td>€13,90</td><td>€11,90</td></tr>
    <tr><th>Memoriale Premium*</th><td>€22,90</td><td>€16,90</td><td>€14,90</td></tr>
    <tr><th>2 memoriali iniziali</th><td colSpan={3}>Gratis, una tantum, anche Premium</td></tr></tbody></table>
  <p className="adc-disclaimer">*Supplemento Premium di €3 proposto, non approvato. Prezzi e IVA da confermare. Nessun pagamento Stripe, abbonamento o memoriale reale viene creato in questo test.</p>
  {editingPlan&&<div className="adc-plan-confirm"><div><strong>Simula {choice===model.plan?"la conferma del piano":model.plan==="PAYG"?"l’attivazione":"il cambio/disdetta"}: {fees[choice].label}</strong>
   <small>{choice==="PAYG"?"Nessun canone e nessun rinnovo.":money(recurring)+" / "+(choice==="YEARLY"?"anno":"mese")+" · rinnovo automatico solo simulato."}</small>
   {choice!=="PAYG"&&<small>Equivalente annuale del canone: {money(annualFee)}.</small>}</div>
   <button type="button" onClick={confirmPlan}>{choice==="PAYG"?"Conferma nessun abbonamento":"Conferma piano DEMO"}</button></div>}
  <h3>2. Crea un memoriale</h3>
  {editingPlan&&<p className="adc-disclaimer" role="status">Conferma prima il piano scelto per applicare la tariffa corretta.</p>}
  {stage==="SUCCESS"&&last?<div className="adc-success" role="status"><strong>Operazione DEMO completata</strong>
   <p>{last.name} · {last.tier==="STANDARD"?"Standard":"Premium"} · {money(last.amount)} {last.amount===0?"(gratuito)": "(pagamento simulato)"}</p>
   <p>Memoriale inserito nello storico locale della DEMO. Non è stato realmente pubblicato e non è stato inviato un invito alla famiglia.</p>
   <button type="button" onClick={()=>setStage("SELECT")}>Crea un altro memoriale</button></div>:
   stage==="CONFIRM"?<div className="adc-confirm"><h4>Riepilogo ordine dimostrativo</h4>
    <dl><div><dt>Persona</dt><dd>{person}</dd></div><div><dt>Referente</dt><dd>{email}</dd></div>
    <div><dt>Prodotto</dt><dd>{tier}</dd></div><div><dt>Piano</dt><dd>{fees[choice].label}</dd></div>
    <div><dt>Totale memoriale</dt><dd><b>{money(price)}</b></dd></div></dl>
    {price>0&&<p className="adc-disclaimer">Pagamento simulato: nella versione reale questo passaggio avverrà su Stripe prima di attivare il memoriale.</p>}
    <div className="adc-actions"><button type="button" onClick={()=>setStage("SELECT")} className="adc-secondary">Indietro</button>
     <button type="button" onClick={pay} disabled={editingPlan}>{price===0?"Attiva gratuito nella DEMO":"Simula pagamento e conferma"}</button></div>
   </div>:<form className="adc-form" onSubmit={prepare}>
    <label>Nome della persona<input required minLength={3} maxLength={180} value={person} onChange={e=>setPerson(e.target.value)}/></label>
    <label>Email referente famiglia<input required type="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)}/></label>
    <label>Tipologia<select value={tier} onChange={e=>setTier(e.target.value as Tier)}><option value="STANDARD">Standard</option><option value="PREMIUM">Premium</option></select></label>
    <div className="adc-due"><small>{remaining>0?"Attivazione gratuita "+(model.freeUsed+1)+" di 2":"Prezzo del memoriale · "+fees[choice].label}</small>
     <strong>{money(price)}</strong></div>
    <button type="submit" disabled={!ready||editingPlan}>Continua al riepilogo</button>
   </form>}
  <h3>3. Storico delle operazioni di prova</h3>
  {model.orders.length===0?<p className="adc-disclaimer">Nessuna operazione demo ancora effettuata.</p>:
   <div className="adc-history">{[...model.orders].reverse().map(o=><div key={o.id}><div><strong>{o.kind==="SUBSCRIPTION"?"Cambio piano · "+fees[o.plan].label:o.name}</strong>
     <small>{new Date(o.date).toLocaleString("it-IT")} · {o.kind==="MEMORIAL"?o.tier:"Abbonamento / opzione"} · simulato</small></div>
    <b>{money(o.amount)}</b></div>)}</div>}
  <p className="adc-disclaimer">I test vengono conservati soltanto nel browser utilizzato, per questa agenzia. «Ricomincia la demo» elimina esclusivamente questi dati locali. Il database reale, Stripe e Reset Demo Data non vengono modificati.</p>
 </section>;
}
