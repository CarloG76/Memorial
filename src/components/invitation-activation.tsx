"use client";
import Link from "next/link";
import {useEffect,useMemo,useState,type FormEvent} from "react";
import {createBrowserSupabaseClient} from "@/lib/supabase/browser";
import "./invitation-activation.css";

type LegalDocument={kind:string;version:string;document_url:string};
export function InvitationActivation({token,kind,documents=[]}:{token:string;kind:"AGENCY"|"FAMILY";documents?:LegalDocument[]}){
 const db=useMemo(()=>createBrowserSupabaseClient(),[]);
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [connectedEmail,setConnectedEmail]=useState<string|null>(null);
 const [checking,setChecking]=useState(true);
 const [busy,setBusy]=useState(false);
 const [accepted,setAccepted]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [consent,setConsent]=useState(false);
 const [privateConsent,setPrivateConsent]=useState(false);
 const [action,setAction]=useState<"REGISTER"|"LOGIN">("REGISTER");
 const terms=documents.find(d=>d.kind==="B2B_TERMS");
 const privacy=documents.find(d=>d.kind==="PRIVACY_NOTICE");
 const legalReady=kind!=="AGENCY"||!!(terms&&privacy);
 useEffect(()=>{
  void db.auth.getUser().then(({data})=>{setConnectedEmail(data.user?.email??null);setChecking(false);});
 },[db]);
 async function credentials(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy)return;
  setBusy(true);setError("");setNotice("");
  if(action==="REGISTER"&&password.length<12){setError("Scegli una password di almeno 12 caratteri.");setBusy(false);return;}
  if(action==="LOGIN"){
   const r=await db.auth.signInWithPassword({email,password});
   if(r.error)setError("Accesso non riuscito. Verifica email e password.");
   else setConnectedEmail(r.data.user.email??email);
  }else{
   const next=(kind==="AGENCY"?"/invito-titolare/":"/invito-famiglia/")+token;
   const redirect=window.location.origin+"/auth/confirm?next="+encodeURIComponent(next);
   const r=await db.auth.signUp({email,password,options:{emailRedirectTo:redirect}});
   if(r.error)setError("Creazione account non riuscita: "+r.error.message);
   else if(r.data.session&&r.data.user?.email_confirmed_at){
    setConnectedEmail(r.data.user.email??email);
   }else setNotice("Account creato. Apri l'email di verifica; al termine potrai tornare automaticamente a questo invito.");
  }
  setPassword("");setBusy(false);
 }
 async function accept(){
  if(busy||!consent||(kind==="AGENCY"&&!privateConsent))return;
  setBusy(true);setError("");setNotice("");
  const r=kind==="AGENCY"?
   await db.rpc("accept_agency_owner_invitation",{invitation_token:token,accepted_terms:terms?.version??"",accepted_privacy:privacy?.version??""}):
   await db.rpc("accept_family_invitation",{invitation_token:token});
  if(r.error)setError("Impossibile attivare l'invito: "+r.error.message);
  else setAccepted(true);
  setBusy(false);
 }
 const label=kind==="AGENCY"?"responsabile dell'agenzia":"familiare responsabile del memoriale";
 return <main className="ia-main"><Link href="/" className="ia-brand">✦ Memorial</Link>
  <span className="workspace-label">INVITO RISERVATO · VALIDO 72 ORE</span>
  <h1>{kind==="AGENCY"?"Attiva la tua agenzia":"Partecipa al memoriale"}</h1>
  <p>Hai ricevuto un invito personale. Verifica la tua email, crea una password e attiva l&apos;accesso come {label}.</p>
  {!legalReady&&<div className="ia-error">Attivazione aziendale sospesa: le condizioni B2B e l&apos;informativa privacy devono essere pubblicate e approvate dall&apos;amministratore prima dell&apos;accettazione.</div>}
  {accepted?<section className="ia-card ia-success"><h2>Invito accettato</h2><p>Le autorizzazioni sono state associate al tuo account.</p><Link href={kind==="AGENCY"?"/console/agenzia?sezione=dashboard":"/console/famiglia?sezione=panoramica"}>Apri il tuo ambiente Memorial</Link></section>:
  checking?<p>Verifica della sessione…</p>:connectedEmail?
   <section className="ia-card"><h2>Conferma attivazione</h2>
    <p>Account collegato: <strong>{connectedEmail}</strong>. Deve coincidere con l&apos;email destinataria dell&apos;invito e risultare verificato.</p>
    {kind==="AGENCY"&&terms&&privacy&&<p>Leggi le <a href={terms.document_url} target="_blank" rel="noopener noreferrer">condizioni B2B</a> e l&apos;<a href={privacy.document_url} target="_blank" rel="noopener noreferrer">informativa privacy</a>.</p>}
    <label className="ia-check"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>Confermo di essere il destinatario dell&apos;invito e di accettare l&apos;accesso al ruolo indicato.</label>
    {kind==="AGENCY"&&<label className="ia-check"><input type="checkbox" checked={privateConsent} onChange={e=>setPrivateConsent(e.target.checked)}/>Accetto le condizioni B2B e dichiaro di aver letto l&apos;informativa privacy pubblicata.</label>}
    <button type="button" disabled={busy||!consent||!legalReady||(kind==="AGENCY"&&!privateConsent)} onClick={()=>void accept()}>{busy?"Attivazione…":"Accetta invito e accedi"}</button>
   </section>:
   <section className="ia-card"><div className="ia-switch"><button type="button" aria-pressed={action==="REGISTER"} onClick={()=>setAction("REGISTER")}>Crea account</button>
    <button type="button" aria-pressed={action==="LOGIN"} onClick={()=>setAction("LOGIN")}>Ho già un account</button></div>
    <form onSubmit={e=>void credentials(e)}>
     <label>Email invitata<input type="email" autoComplete="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)}/></label>
     <label>Password<input type="password" autoComplete={action==="REGISTER"?"new-password":"current-password"} minLength={action==="REGISTER"?12:1} required value={password} onChange={e=>setPassword(e.target.value)}/></label>
     <button type="submit" disabled={busy}>{busy?"Attendere…":action==="REGISTER"?"Crea password e verifica email":"Accedi"}</button>
    </form>
   </section>}
  {error&&<p className="ia-error" role="alert">{error}</p>}
  {notice&&<p className="ia-notice" role="status">{notice}</p>}
  <p className="ia-foot">Il link è personale e monouso: scade dopo 72 ore. Se è scaduto, chiedi a chi ti ha invitato di generarne uno nuovo.</p>
 </main>;
}
