"use client";
import {useEffect,useMemo,useState,type FormEvent} from "react";
import Link from "next/link";
import {createBrowserSupabaseClient} from "@/lib/supabase/browser";
export function AgencyInviteAccept({token}:{token:string}){
 const db=useMemo(()=>createBrowserSupabaseClient(),[]);
 const [userEmail,setUserEmail]=useState<string|null>(null);
 const [loading,setLoading]=useState(true);
 const [working,setWorking]=useState(false);
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [message,setMessage]=useState("");
 const [result,setResult]=useState<{success:boolean;agency:string}|null>(null);
 useEffect(()=>{
  void db.auth.getUser().then(({data})=>{setUserEmail(data.user?.email??null);setLoading(false);});
 },[db]);
 async function accept(){
  setWorking(true);setMessage("");
  const r=await db.rpc("agency_accept_operator_invite",{invitation_token:token});
  if(r.error)setMessage("Invito non accettato: "+r.error.message);
  else setResult(r.data as {success:boolean;agency:string});
  setWorking(false);
 }
 async function register(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setWorking(true);setMessage("");
  if(password.length<10){setMessage("La password deve contenere almeno 10 caratteri.");setWorking(false);return;}
  const r=await db.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin+"/auth/callback"}});
  if(r.error)setMessage("Registrazione non riuscita: "+r.error.message);
  else setMessage("Registrazione ricevuta. Verifica l'indirizzo email, poi torna a questo link per accettare l'invito.");
  setWorking(false);setPassword("");
 }
 return <main style={{maxWidth:620,margin:"48px auto",padding:"20px",fontFamily:"Montserrat,Arial,sans-serif",color:"#173951"}}>
  <Link href="/">✦ Memorial</Link><h1>Invito a collaborare con un'agenzia</h1>
  <p>Questo invito dà accesso come <strong>Operatore</strong> all'agenzia che ti ha invitato. Non permette di amministrare altre agenzie.</p>
  {loading?<p>Verifica dell'accesso…</p>:result?.success?
   <section role="status" style={{background:"#eaf6ee",borderRadius:10,padding:18}}>
    <h2>Accesso attivato</h2><p>Sei ora Operatore di <strong>{result.agency}</strong>.</p>
    <Link href="/console/agenzia">Apri la tua area Agenzia</Link>
   </section>:userEmail?
   <section style={{background:"white",padding:20,borderRadius:12,border:"1px solid #e0e6eb"}}>
    <p>Hai effettuato l'accesso come <strong>{userEmail}</strong>.</p>
    <p>L'email di questo account deve coincidere con quella indicata nell'invito.</p>
    <button onClick={()=>void accept()} disabled={working} style={{padding:"12px 18px",background:"#183a55",color:"white",border:0,borderRadius:8,cursor:"pointer"}}>{working?"Verifica in corso…":"Accetta invito"}</button>
   </section>:
   <section style={{background:"white",padding:20,borderRadius:12,border:"1px solid #e0e6eb"}}>
    <h2>Hai già un account?</h2>
    <p><Link href="/accedi">Accedi</Link> e poi riapri questo link di invito.</p>
    <h2>Nuovo collaboratore</h2>
    <form onSubmit={e=>void register(e)} style={{display:"grid",gap:10}}>
     <label>Email invitata<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} style={{display:"block",width:"100%",padding:10}}/></label>
     <label>Password (almeno 10 caratteri)<input required type="password" minLength={10} value={password} onChange={e=>setPassword(e.target.value)} style={{display:"block",width:"100%",padding:10}}/></label>
     <button type="submit" disabled={working} style={{padding:12,background:"#183a55",color:"white",border:0,borderRadius:8,cursor:"pointer"}}>{working?"Registrazione…":"Crea account collaboratore"}</button>
    </form>
   </section>}
  {message&&<p role="status" style={{marginTop:14,color:message.includes("non")?"#963a2d":"#28664c"}}>{message}</p>}
 </main>;
}
