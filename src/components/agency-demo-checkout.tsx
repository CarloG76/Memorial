"use client";
import {useCallback,useEffect,useMemo,useState,type FormEvent} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {createBrowserSupabaseClient} from "@/lib/supabase/browser";
import {OpenAsButton} from "./superadmin-open-as-button";
import "./agency-demo-checkout.css";

type Plan="PAYG"|"MONTHLY"|"YEARLY";
type Tier="STANDARD"|"PREMIUM";
type Stage="SELECT"|"CONFIRM"|"SUCCESS";
type DemoEvent={id:string;kind:"PLAN_SELECTED"|"MEMORIAL_CONFIRMED";name:string|null;email:string|null;tier:Tier|null;plan:Plan;amount:number;is_free:boolean;memorial_id:string|null;date:string};
type Snapshot={plan:Plan;free_used:number;free_remaining:number;events:DemoEvent[]};
type Created={memorial_id:string;demo_code:string;family_invite_token:string;family_email:string;amount_cents:number;free_activation:boolean;free_remaining:number;payment_status:string;already_processed?:boolean};
const fees:Record<Plan,{label:string;subscription:number;standard:number;premium:number;period:string}>={
 PAYG:{label:"Senza abbonamento",subscription:0,standard:19.90,premium:22.90,period:"Nessun rinnovo"},
 MONTHLY:{label:"Pro mensile",subscription:39.90,standard:13.90,premium:16.90,period:"Rinnovo mensile"},
 YEARLY:{label:"Pro annuale",subscription:379,standard:11.90,premium:14.90,period:"Rinnovo annuale"}
};
const money=(n:number)=>new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR"}).format(n);
export function AgencyDemoCheckout({agencyId,agencyName,contextKey=null,isDemo=false}:{
 agencyId:string;agencyName:string;contextKey?:string|null;isDemo?:boolean
}){
 const db=useMemo(()=>createBrowserSupabaseClient(),[]);
 const router=useRouter();
 const [model,setModel]=useState<Snapshot|null>(null);
 const [choice,setChoice]=useState<Plan>("PAYG");
 const [tier,setTier]=useState<Tier>("STANDARD");
 const [person,setPerson]=useState("");
 const [email,setEmail]=useState("");
 const [stage,setStage]=useState<Stage>("SELECT");
 const [last,setLast]=useState<Created|null>(null);
 const [saving,setSaving]=useState(false);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const [editingPlan,setEditingPlan]=useState(false);
 const refresh=useCallback(async()=>{
  const {data,error:dbError}=await db.rpc("agency_demo_commercial_snapshot",{agency_key:agencyId,context_key:contextKey});
  if(dbError){setError("Impossibile leggere la DEMO: "+dbError.message);setLoading(false);return;}
  const fresh=data as Snapshot;
  setModel(fresh);setLoading(false);
  return fresh;
 },[db,agencyId,contextKey]);
 useEffect(()=>{if(isDemo)void refresh();},[isDemo,refresh]);
 if(!isDemo)return null;
 const remaining=model?.free_remaining??0;
 const currentPlan=model?.plan??"PAYG";
 const price=remaining>0?0:tier==="STANDARD"?fees[currentPlan].standard:fees[currentPlan].premium;
 const annualFee=choice==="MONTHLY"?fees[choice].subscription*12:choice==="YEARLY"?fees[choice].subscription:0;
 const events=model?.events??[];
 const orders=events.filter(e=>e.kind==="MEMORIAL_CONFIRMED");
 function selectPlan(p:Plan){setChoice(p);setEditingPlan(p!==currentPlan);setStage("SELECT");setLast(null);}
 async function confirmPlan(){
  if(saving||!model)return;
  if(choice===currentPlan){setEditingPlan(false);return;}
  setSaving(true);setError("");setMessage("");
  const {data,error:dbError}=await db.rpc("agency_demo_choose_plan",{
   agency_key:agencyId,selected_plan:choice,request_key:crypto.randomUUID(),context_key:contextKey
  });
  if(dbError)setError("Piano DEMO non aggiornato: "+dbError.message);
  else{setModel(data as Snapshot);setEditingPlan(false);setMessage("Scelta commerciale salvata nella DEMO. Nessun abbonamento o addebito reale.");}
  setSaving(false);
 }
 function prepare(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(saving||!model||editingPlan||person.trim().length<3||!email.includes("@"))return;
  setStage("CONFIRM");setError("");setLast(null);
 }
 async function create(){
  if(saving||!model||editingPlan)return;
  setSaving(true);setError("");setMessage("");
  const {data,error:dbError}=await db.rpc("agency_demo_create_memorial",{
   agency_key:agencyId,person_name:person.trim(),memorial_tier:tier,family_email:email.trim(),
   request_key:crypto.randomUUID(),context_key:contextKey
  });
  if(dbError)setError("Memoriale non creato: "+dbError.message);
  else{
   const created=data as Created;
   if(created.already_processed)setError("L'operazione esiste già. Aggiorna l'elenco per consultare il memoriale.");
   else{
    setLast(created);setStage("SUCCESS");setPerson("");setEmail("");
    setMessage("Memoriale e famiglia collegati nel database. Il pagamento è simulato, ma lo scheletro è stato creato.");
    await refresh();router.refresh();
   }
  }
  setSaving(false);
 }
 async function copyInvite(){
  if(!last?.family_invite_token)return;
  const url=window.location.origin+"/invito-famiglia/"+last.family_invite_token;
  try{await navigator.clipboard.writeText(url);setMessage("Invito famiglia copiato.");}
  catch{setMessage("Seleziona e copia il link sottostante.");}
 }
 return <section className="adc-root" aria-label="Checkout dimostrativo con memoriali reali">
  <div className="adc-top"><div><span className="adc-kicker">DEMO REALE · PAGAMENTO SIMULATO</span>
   <h2>Prova l'intero percorso di acquisto</h2>
   <p>{agencyName} · Il checkout non addebita denaro, ma crea realmente memoriale, famiglia e invito.</p></div>
   <button type="button" className="adc-reset" onClick={()=>void refresh()} disabled={loading||saving}>Aggiorna dati</button>
  </div>
  {error&&<p role="alert" className="afm-error">{error}</p>}
  {message&&<p role="status" className="afm-success">{message}</p>}
  <div className="adc-summary">
   <div><strong>{loading?"…":remaining}</strong><span>Memoriali gratuiti iniziali rimasti</span></div>
   <div><strong>{fees[currentPlan].label}</strong><span>Piano DEMO salvato</span></div>
   <div><strong>{orders.length}</strong><span>Memoriali creati nel database</span></div>
  </div>
  <h3>1. Scegli il piano</h3>
  <div className="adc-plans">
   {(["PAYG","MONTHLY","YEARLY"] as Plan[]).map(p=><button type="button" key={p} onClick={()=>selectPlan(p)}
    disabled={loading||saving} className={"adc-plan "+(choice===p?"chosen":"")} aria-pressed={choice===p}>
    <span className="adc-plan-title">{fees[p].label}</span>
    <strong>{p==="PAYG"?"€0":money(fees[p].subscription)}</strong>
    <small>{p==="MONTHLY"?"/ mese · rinnovo simulato":p==="YEARLY"?"/ anno · rinnovo simulato":"nessun canone"}</small>
    <span className="adc-line">Standard <b>{money(fees[p].standard)}</b></span>
    <span className="adc-line">Premium* <b>{money(fees[p].premium)}</b></span>
    <span className="adc-plan-foot">{p==="PAYG"?"Paghi solo i singoli memoriali":p==="MONTHLY"?"Canone e prezzo unitario ridotto":"Prezzo unitario più basso"}</span>
   </button>)}
  </div>
  <table className="adc-table"><thead><tr><th>Condizioni</th><th>Senza abbonamento</th><th>Pro mensile</th><th>Pro annuale</th></tr></thead>
   <tbody><tr><th>Canone</th><td>€0</td><td>€39,90/mese</td><td>€379/anno</td></tr>
    <tr><th>Memoriale Standard</th><td>€19,90</td><td>€13,90</td><td>€11,90</td></tr>
    <tr><th>Memoriale Premium*</th><td>€22,90</td><td>€16,90</td><td>€14,90</td></tr>
    <tr><th>2 memoriali iniziali</th><td colSpan={3}>Gratuiti una volta, anche Premium</td></tr></tbody></table>
  <p className="adc-disclaimer">*Premium +€3 è un'ipotesi commerciale. Il canone e i rinnovi sono simulati; nessun pagamento o fattura reale.</p>
  {editingPlan&&<div className="adc-plan-confirm"><div><strong>{currentPlan==="PAYG"?"Attiva":"Cambia"} piano DEMO: {fees[choice].label}</strong>
    <small>{choice==="PAYG"?"Nessun abbonamento, nessun rinnovo.":money(fees[choice].subscription)+" / "+(choice==="MONTHLY"?"mese":"anno")+" · rinnovo soltanto simulato."}</small>
    {choice!=="PAYG"&&<small>Canone annualizzato: {money(annualFee)}.</small>}</div>
   <button type="button" disabled={saving} onClick={()=>void confirmPlan()}>{saving?"Salvataggio…":"Conferma piano DEMO"}</button>
  </div>}
  <h3>2. Crea un memoriale</h3>
  {stage==="SUCCESS"&&last?<div className="adc-success" role="status">
   <strong>Memoriale {last.demo_code} creato davvero</strong>
   <p>{last.free_activation?"Prima attivazione gratuita":"Operazione confermata"} · {money(last.amount_cents/100)} · {last.payment_status==="SIMULATED"?"Pagamento fake":"Gratuito"}</p>
   <p>Scheletro non pubblico, famiglia associata e invito di 72 ore pronti. L'invito non è ancora stato inviato via email.</p>
   <label className="adc-invite-label">Link di invito famiglia<input readOnly value={window.location.origin+"/invito-famiglia/"+last.family_invite_token} onFocus={e=>e.target.select()}/></label>
   <div className="adc-actions"><button type="button" onClick={()=>void copyInvite()}>Copia invito</button>
    {contextKey&&<OpenAsButton kind="FAMILY" targetId={last.memorial_id}/>}
    {!contextKey&&<Link href={"/console/agenzia/memoriali/"+last.memorial_id}>Scheda memoriale</Link>}
    <button type="button" onClick={()=>{setStage("SELECT");setLast(null);}}>Crea un altro memoriale</button></div>
  </div>:
  stage==="CONFIRM"?<div className="adc-confirm">
   <h4>Conferma ordine DEMO</h4>
   <dl><div><dt>Persona</dt><dd>{person}</dd></div><div><dt>Famiglia</dt><dd>{email}</dd></div>
    <div><dt>Prodotto</dt><dd>{tier}</dd></div><div><dt>Piano</dt><dd>{fees[currentPlan].label}</dd></div>
    <div><dt>Importo</dt><dd><b>{money(price)}</b></dd></div></dl>
   <p className="adc-disclaimer">{price===0?"Questa creazione utilizza un'attivazione gratuita.":"Simuliamo il pagamento e registriamo l'ordine come SIMULATO."} In entrambi i casi viene creato un vero scheletro del memoriale.</p>
   <div className="adc-actions"><button type="button" className="adc-secondary" onClick={()=>setStage("SELECT")} disabled={saving}>Indietro</button>
    <button type="button" disabled={saving||editingPlan} onClick={()=>void create()}>{saving?"Creazione…":price===0?"Attiva memoriale gratuito":"Conferma pagamento fake e crea memoriale"}</button></div>
  </div>:<form className="adc-form" onSubmit={prepare}>
   <label>Nome della persona<input required minLength={3} maxLength={180} value={person} onChange={e=>setPerson(e.target.value)}/></label>
   <label>Email del referente famiglia<input required type="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)}/></label>
   <label>Tipologia<select value={tier} onChange={e=>setTier(e.target.value as Tier)}><option value="STANDARD">Standard</option><option value="PREMIUM">Premium</option></select></label>
   <div className="adc-due"><small>{remaining>0?"Memoriale gratuito "+((model?.free_used??0)+1)+" di 2":"Prezzo con piano "+fees[currentPlan].label}</small><strong>{money(price)}</strong></div>
   <button type="submit" disabled={loading||saving||editingPlan||!model}>Continua al riepilogo</button>
  </form>}
  <h3>3. Storico DEMO nel database</h3>
  {events.length===0?<p className="adc-disclaimer">Nessuna operazione demo registrata.</p>:
  <div className="adc-history">{events.map(e=><div key={e.id}><div><strong>{e.kind==="PLAN_SELECTED"?"Piano DEMO: "+fees[e.plan].label:e.name+" · "+e.tier}</strong>
   <small>{new Date(e.date).toLocaleString("it-IT")} · {e.kind==="MEMORIAL_CONFIRMED"?"Scheletro creato · "+(e.is_free?"gratuito":"pagamento fake"):"Sottoscrizione simulata"} · {e.memorial_id??"—"}</small></div>
   <b>{money(e.amount/100)}</b></div>)}</div>}
  <p className="adc-disclaimer">I memoriali e gli inviti sono archiviati nel database DEMO. Il pagamento è finto e non ha valore fiscale. Per cancellare e ripristinare lo scenario iniziale usa il comando SuperAdmin «Reset Demo Data».</p>
 </section>;
}
