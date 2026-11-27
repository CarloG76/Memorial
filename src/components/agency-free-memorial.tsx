"use client";
import {useCallback,useEffect,useMemo,useState,type FormEvent} from "react";
import {createBrowserSupabaseClient} from "@/lib/supabase/browser";
import "./agency-free-memorial.css";
import {AgencyDemoCheckout} from "./agency-demo-checkout";
import {StripeCardCheckoutSandbox} from "./stripe-card-checkout-sandbox";

type FreeStatus={total:number;used:number;remaining:number;not_configured?:boolean};
export function AgencyFreeMemorialCreator({agencyId,contextKey=null,agencyName,isDemo=false}:{agencyId:string;contextKey?:string|null;agencyName:string;isDemo?:boolean}){
 const db=useMemo(()=>createBrowserSupabaseClient(),[]);
 const [free,setFree]=useState<FreeStatus|null>(null);
 const [name,setName]=useState("");
 const [tier,setTier]=useState<"STANDARD"|"PREMIUM">("STANDARD");
 const [email,setEmail]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [invite,setInvite]=useState("");
 const [createdId,setCreatedId]=useState("");
 const refresh=useCallback(async()=>{
  const r=await db.rpc("agency_free_entitlements_status",{agency_key:agencyId});
  if(r.error)setError("Impossibile leggere le attivazioni gratuite: "+r.error.message);
  else setFree(r.data as FreeStatus);
 },[db,agencyId]);
 useEffect(()=>{
  let cancelled=false;
  void db.rpc("agency_free_entitlements_status",{agency_key:agencyId}).then(r=>{
   if(cancelled)return;
   if(r.error)setError("Impossibile leggere le attivazioni gratuite: "+r.error.message);
   else setFree(r.data as FreeStatus);
  });
  return ()=>{cancelled=true;};
 },[db,agencyId]);
 async function create(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy||!free?.remaining)return;
  setBusy(true);setError("");setNotice("");setInvite("");setCreatedId("");
  const r=await db.rpc("agency_create_free_memorial",{agency_key:agencyId,person_name:name,memorial_tier:tier,family_email:email,context_key:contextKey});
  if(r.error)setError("Impossibile creare il memoriale: "+r.error.message);
  else{
   const result=r.data as {memorial_id:string;family_invite_token:string;family_email:string;free_remaining:number};
   setCreatedId(result.memorial_id);
   setInvite(window.location.origin+"/invito-famiglia/"+result.family_invite_token);
   setNotice("Memoriale creato e attivazione gratuita registrata. Condividi il link con "+result.family_email+" (scade fra 72 ore).");
   setName("");setEmail("");
   await refresh();
  }
  setBusy(false);
 }
 async function copy(){
  try{await navigator.clipboard.writeText(invite);setNotice("Link di invito familiare copiato.");}
  catch{setNotice("Seleziona e copia manualmente il link.");}
 }
 const remaining=free?.remaining??0;
 if(isDemo)return <AgencyDemoCheckout agencyId={agencyId} agencyName={agencyName} contextKey={contextKey} isDemo/>;
 return <section className="afm-section">
  <header><div><span className="workspace-label">AGENZIA / NUOVO MEMORIALE</span>
   <h2>Attiva i memoriali gratuiti</h2><p>{agencyName} · 2 creazioni iniziali gratuite, una sola volta.</p></div>
   <div className="afm-counter"><strong>{free?.not_configured?"—":free?.remaining??"…"}</strong><small>gratuiti rimasti</small></div>
  </header>
  {free?.not_configured?<div className="afm-info">Questa agenzia non ha ancora il diritto alle 2 attivazioni iniziali registrato. Gli account legacy e DEMO non vengono accreditati automaticamente per evitare dati falsi.</div>:
  remaining>0?<form onSubmit={e=>void create(e)} className="afm-form">
   <label>Nome della persona<input required minLength={3} maxLength={180} value={name} onChange={e=>setName(e.target.value)} placeholder="Nome e cognome"/></label>
   <label>Tipologia<select value={tier} onChange={e=>setTier(e.target.value as "STANDARD"|"PREMIUM")}><option value="STANDARD">Standard — gratuito</option><option value="PREMIUM">Premium — gratuito</option></select></label>
   <label>Email del referente familiare<input type="email" maxLength={254} required value={email} onChange={e=>setEmail(e.target.value)} placeholder="famiglia@example.it"/></label>
   <button type="submit" disabled={busy}>{busy?"Attivazione…":"Attiva memoriale gratuito e genera invito famiglia"}</button>
  </form>:
  <div className="afm-info"><strong>Le due attivazioni gratuite sono terminate.</strong><p>Puoi continuare senza abbonamento a €19,90 Standard o €22,90 Premium (sovrapprezzo Premium ancora da confermare). Il checkout Stripe non è ancora attivato, quindi non verranno creati memoriali a pagamento senza incasso.</p></div>}
  {remaining===0&&free&&!free.not_configured&&process.env.NEXT_PUBLIC_STRIPE_SANDBOX_ENABLED==="true"&&<StripeCardCheckoutSandbox agencyId={agencyId}/>}
  {invite&&<div className="afm-output"><label>Link personale per la famiglia (72 ore)<input readOnly value={invite} onFocus={e=>e.target.select()}/></label>
   <button type="button" onClick={()=>void copy()}>Copia link</button>
   {createdId&&<small>Memoriale registrato: {createdId}</small>}</div>}
  {notice&&<p role="status" className="afm-success">{notice}</p>}
  {error&&<p role="alert" className="afm-error">{error}</p>}
  <p className="afm-foot">Il memoriale è privato durante la preparazione. Il referente familiare deve verificare la propria email e accettare l&apos;invito. Nessuna email è inviata automaticamente.</p>
 </section>;
}

export function AgencyFreeBalance({agencyId}:{agencyId:string}){
 const db=useMemo(()=>createBrowserSupabaseClient(),[]);
 const [status,setStatus]=useState<FreeStatus|null>(null);
 const [error,setError]=useState(false);
 useEffect(()=>{
  let cancelled=false;
  void db.rpc("agency_free_entitlements_status",{agency_key:agencyId}).then(({data,error:dbError})=>{
   if(cancelled)return;
   if(dbError){setError(true);return;}
   setStatus(data as FreeStatus);setError(false);
  });
  return ()=>{cancelled=true;};
 },[db,agencyId]);
 return <div className="afm-balance" role="status">
  <strong>{error?"—":status?.not_configured?"Non assegnate":status?.remaining??"…"}</strong>
  <span>Attivazioni gratuite residue</span>
  <small>{status?.not_configured?"I diritti gratuiti non sono stati ancora assegnati a questa agenzia.":status?"Utilizzate: "+status.used+" su "+status.total+" disponibili una sola volta.":"Caricamento stato…"}</small>
 </div>;
}
