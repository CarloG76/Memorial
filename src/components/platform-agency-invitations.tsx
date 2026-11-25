"use client";
import {useCallback,useEffect,useMemo,useState,type FormEvent} from "react";
import {createBrowserSupabaseClient} from "@/lib/supabase/browser";
import "./platform-agency-invitations.css";
type Invite={id:string;company:string;email:string;created_at:string;expires_at:string;accepted_at:string|null;revoked_at:string|null};
export function PlatformAgencyInvitations(){
 const db=useMemo(()=>createBrowserSupabaseClient(),[]);
 const [name,setName]=useState("");const [vat,setVat]=useState("");const [country,setCountry]=useState("IT");
 const [email,setEmail]=useState("");const [busy,setBusy]=useState(false);
 const [status,setStatus]=useState("");const [error,setError]=useState("");
 const [clock]=useState(()=>Date.now());
 const [tokenLink,setTokenLink]=useState("");const [invites,setInvites]=useState<Invite[]>([]);
 const refresh=useCallback(async()=>{
  const r=await db.rpc("platform_agency_invitation_directory");
  if(r.error)setError("Inviti non disponibili: "+r.error.message);
  else setInvites((r.data??[]) as Invite[]);
 },[db]);
 useEffect(()=>{void Promise.resolve().then(refresh);},[refresh]);
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy)return;
  setBusy(true);setError("");setStatus("");setTokenLink("");
  const r=await db.rpc("platform_invite_agency_owner",{company:name,tax_id:vat,invite_email:email,invite_country:country});
  if(r.error)setError("Invito non creato: "+r.error.message);
  else{
   const data=r.data as {token:string;email:string};
   setTokenLink(window.location.origin+"/invito-titolare/"+data.token);
   setStatus("Invito generato, valido 72 ore. Condividi il link con il titolare all’indirizzo indicato.");
   setName("");setVat("");setEmail("");
   await refresh();
  }
  setBusy(false);
 }
 async function revoke(id:string){
  if(busy)return;
  setBusy(true);setError("");
  const r=await db.rpc("platform_revoke_agency_owner_invitation",{invite_key:id});
  if(r.error)setError("Revoca non riuscita: "+r.error.message);
  else{setStatus("Invito revocato.");setTokenLink("");await refresh();}
  setBusy(false);
 }
 async function copy(){
  try{await navigator.clipboard.writeText(tokenLink);setStatus("Link copiato.");}
  catch{setError("Copia il link selezionandolo manualmente.");}
 }
 return <section className="pai-card">
  <header><div><span className="workspace-label">ONBOARDING AGENZIA</span><h2>Crea invito per nuova agenzia</h2><p>Attiva un contatto durante la visita commerciale. L&apos;invito dura 72 ore; il responsabile imposta le proprie credenziali.</p></div></header>
  <form className="pai-form" onSubmit={e=>void submit(e)}>
   <label>Ragione sociale<input required minLength={2} maxLength={240} autoComplete="organization" value={name} onChange={e=>setName(e.target.value)}/></label>
   <label>Partita IVA o identificativo fiscale<input required minLength={5} maxLength={32} value={vat} onChange={e=>setVat(e.target.value)}/></label>
   <label>Paese (ISO 2 caratteri)<input required minLength={2} maxLength={2} value={country} onChange={e=>setCountry(e.target.value.toUpperCase())}/></label>
   <label>Email del titolare<input type="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)}/></label>
   <button type="submit" disabled={busy}>{busy?"Generazione…":"Genera invito 72 ore"}</button>
  </form>
  {tokenLink&&<div className="pai-invite-output"><label>Link riservato — visibile soltanto adesso<input readOnly value={tokenLink} onFocus={e=>e.target.select()}/></label><button type="button" onClick={()=>void copy()}>Copia link</button></div>}
  {status&&<p className="pai-ok" role="status">{status}</p>}
  {error&&<p className="pai-error" role="alert">{error}</p>}
  <h3>Inviti creati</h3>
  <div className="pai-invite-list">{invites.length===0?<p>Nessun invito.</p>:invites.map(i=>{
   const state=i.accepted_at?"Accettato":i.revoked_at?"Revocato":new Date(i.expires_at).getTime()<=clock?"Scaduto":"In attesa";
   return <div key={i.id}><div><strong>{i.company}</strong><small>{i.email} · {state} · scadenza {new Date(i.expires_at).toLocaleString("it-IT")}</small></div>
    {state==="In attesa"&&<button type="button" disabled={busy} onClick={()=>void revoke(i.id)}>Revoca</button>}</div>;
  })}</div>
  <p className="pai-footnote">Per l&apos;attivazione definitiva servono i documenti B2B e privacy approvati, una email verificata e l&apos;accettazione del titolare. La creazione dell&apos;invito non attiva servizi né invia automaticamente email.</p>
 </section>;
}
