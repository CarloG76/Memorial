"use client";

import {useEffect,useMemo,useState,type FormEvent} from "react";
import {createBrowserSupabaseClient} from "@/lib/supabase/browser";
import "./agency-team-manager.css";

type Member={
 user_id:string;role:"OWNER"|"OPERATOR";active:boolean;display_name:string;login_email:string;
 first_name:string;last_name:string;phone:string;contact_email:string;contact_complete:boolean;
};
type Invite={id:string;email:string;created_at:string;expires_at:string;accepted_at:string|null;revoked_at:string|null};
type Team={agency_id:string;agency_name:string;members:Member[];invites:Invite[]};
type OwnerValues={first_name:string;last_name:string;phone:string;email:string};

function OwnerContact({owner,onSave,busy}:{owner:Member;onSave:(userId:string,values:OwnerValues)=>Promise<void>;busy:boolean}){
 const [values,setValues]=useState<OwnerValues>({
  first_name:owner.first_name??"",last_name:owner.last_name??"",phone:owner.phone??"",email:owner.contact_email??""
 });
 const [working,setWorking]=useState(false);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setWorking(true);
  try{await onSave(owner.user_id,values);}finally{setWorking(false);}
 }
 return <form className="agency-owner-card" onSubmit={e=>void submit(e)}>
  <div className="agency-team-row"><strong>Titolare / Owner</strong>
   <span className={owner.contact_complete?"agency-team-complete":"agency-team-incomplete"}>
    {owner.contact_complete?"Anagrafica completa":"Dati obbligatori da completare"}
   </span></div>
  <p className="agency-team-login">Account di accesso: {owner.login_email||"Email account non disponibile"}</p>
  <div className="agency-team-fields">
   <label>Nome *<input required minLength={2} maxLength={100} autoComplete="given-name" value={values.first_name} onChange={e=>setValues(v=>({...v,first_name:e.target.value}))}/></label>
   <label>Cognome *<input required minLength={2} maxLength={100} autoComplete="family-name" value={values.last_name} onChange={e=>setValues(v=>({...v,last_name:e.target.value}))}/></label>
   <label>Telefono *<input required type="tel" pattern="\+[1-9][0-9 ()-]{6,23}" placeholder="+39 333 1234567" autoComplete="tel" value={values.phone} onChange={e=>setValues(v=>({...v,phone:e.target.value}))}/></label>
   <label>Email di contatto *<input required type="email" maxLength={254} autoComplete="email" value={values.email} onChange={e=>setValues(v=>({...v,email:e.target.value}))}/></label>
  </div>
  <p className="agency-team-hint">Questa email è il recapito per contattare il titolare; non cambia l'email utilizzata per accedere.</p>
  <button type="submit" disabled={busy||working}>{working?"Salvataggio…":"Salva anagrafica Owner"}</button>
 </form>;
}
export function AgencyTeamManager({agencyId,contextKey=null}:{agencyId:string;contextKey?:string|null}){
 const db=useMemo(()=>createBrowserSupabaseClient(),[]);
 const [team,setTeam]=useState<Team|null>(null);
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [email,setEmail]=useState("");
 const [link,setLink]=useState("");
 async function refresh(){
  const r=await db.rpc("agency_team_snapshot",{agency_key:agencyId,context_key:contextKey});
  if(r.error){setError("Impossibile caricare gli utenti: "+r.error.message);}
  else{setTeam(r.data as Team);setError("");}
  setLoading(false);
 }
 useEffect(()=>{void refresh();},[agencyId,contextKey,db]);
 async function saveOwner(id:string,values:OwnerValues){
  setBusy(true);setError("");setNotice("");
  const r=await db.rpc("agency_save_owner_contact",{
   agency_key:agencyId,owner_key:id,first_name:values.first_name,
   last_name:values.last_name,phone:values.phone,email:values.email,context_key:contextKey
  });
  setBusy(false);
  if(r.error){setError("Salvataggio non riuscito: "+r.error.message);return;}
  setNotice("Anagrafica Owner salvata.");await refresh();
 }
 async function invite(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy)return;
  setBusy(true);setError("");setNotice("");setLink("");
  const r=await db.rpc("agency_invite_operator",{agency_key:agencyId,invited_email:email,context_key:contextKey});
  setBusy(false);
  if(r.error){setError("Invito non creato: "+r.error.message);return;}
  const data=r.data as {token:string;email:string};
  setLink(window.location.origin+"/invito-agenzia/"+encodeURIComponent(data.token));
  setEmail("");
  setNotice("Invito creato. Condividi il link con "+data.email+"; solo quell'indirizzo potrà accettarlo.");
  await refresh();
 }
 async function changeMember(member:Member){
  setBusy(true);setError("");setNotice("");
  const r=await db.rpc("agency_set_operator_active",{
   agency_key:agencyId,operator_key:member.user_id,enabled:!member.active,context_key:contextKey
  });
  setBusy(false);
  if(r.error){setError("Operazione non riuscita: "+r.error.message);return;}
  setNotice(member.active?"Operatore disattivato.":"Operatore riattivato.");await refresh();
 }
 async function revoke(inviteId:string){
  setBusy(true);setError("");setNotice("");
  const r=await db.rpc("agency_revoke_operator_invite",{agency_key:agencyId,invite_key:inviteId,context_key:contextKey});
  setBusy(false);
  if(r.error){setError("Revoca non riuscita: "+r.error.message);return;}
  setNotice("Invito revocato.");setLink("");await refresh();
 }
 async function copy(){
  try{await navigator.clipboard.writeText(link);setNotice("Link copiato.");}
  catch{setNotice("Seleziona e copia manualmente il link.");}
 }
 return <section className="agency-team" aria-label="Titolare e collaboratori dell'agenzia">
  <div className="agency-team-header"><h2>Titolare e collaboratori</h2><p>Contatti del responsabile e accessi del personale dell'agenzia.</p></div>
  {loading?<p>Caricamento utenti…</p>:!team?<p>Utenti non disponibili.</p>:<>
   {team.members.filter(m=>m.role==="OWNER").map(m=><OwnerContact key={m.user_id} owner={m} onSave={saveOwner} busy={busy}/>)}
   <div className="agency-team-staff">
    <h3>Collaboratori autorizzati</h3>
    <p>Gli Operator possono accedere soltanto ai dati delle agenzie a cui sono associati. Non possono invitare altri utenti o cambiare il titolare.</p>
    {team.members.filter(m=>m.role==="OPERATOR").length===0?<p>Nessun collaboratore.</p>:
     team.members.filter(m=>m.role==="OPERATOR").map(member=><div className="agency-team-person" key={member.user_id}>
      <div><strong>{member.display_name||member.login_email||"Collaboratore"}</strong><small>{member.login_email}</small></div>
      <span>{member.active?"Attivo":"Disattivato"}</span>
      <button type="button" disabled={busy} onClick={()=>void changeMember(member)}>{member.active?"Disattiva":"Riattiva"}</button>
     </div>)}
    <h3>Invita un collaboratore</h3>
    <form className="agency-team-invite" onSubmit={e=>void invite(e)}>
     <label>Email personale dell'utente<input required type="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} placeholder="collaboratore@azienda.it"/></label>
     <button type="submit" disabled={busy}>{busy?"Attendere…":"Genera invito"}</button>
    </form>
    {link&&<div className="agency-team-link"><label>Link di invito da condividere<input readOnly value={link} onFocus={e=>e.target.select()}/></label><button type="button" onClick={()=>void copy()}>Copia link</button><small>Il link è visibile solo adesso, scade dopo 7 giorni e funziona soltanto per l'email indicata. Non viene inviata automaticamente un'email.</small></div>}
    {(team.invites??[]).filter(i=>!i.revoked_at&&new Date(i.expires_at).getTime()>Date.now()).length>0&&
     <div className="agency-team-pending"><h4>Inviti in attesa</h4>{team.invites.filter(i=>!i.revoked_at&&new Date(i.expires_at).getTime()>Date.now()).map(i=><div className="agency-team-person" key={i.id}><div><strong>{i.email}</strong><small>Scade il {new Date(i.expires_at).toLocaleDateString("it-IT")}</small></div><button type="button" disabled={busy} onClick={()=>void revoke(i.id)}>Revoca</button></div>)}</div>}
   </div>
  </>}
  {error&&<p role="alert" className="agency-team-error">{error}</p>}
  {notice&&<p role="status" className="agency-team-message">{notice}</p>}
 </section>;
}
