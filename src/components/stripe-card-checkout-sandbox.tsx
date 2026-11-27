"use client";

import {useRef,useState,type FormEvent} from "react";
import Script from "next/script";
import {formatEuro} from "@/lib/business/commercial-catalog";

type Tier="STANDARD"|"PREMIUM";
type StripeCheckout={
 createPaymentElement:()=>{mount:(target:HTMLElement)=>void;unmount:()=>void};
 loadActions:()=>Promise<{actions?:{confirm:()=>Promise<{type:string;error?:{message?:string}}>} }>;
};
type StripeBrowser={
 initCheckoutElementsSdk:(input:{clientSecret:string})=>StripeCheckout;
};
type StripeWindow=Window & {Stripe?:(key:string)=>StripeBrowser};
type SessionResponse={clientSecret:string;publishableKey:string;orderId:string;error?:string};

export function StripeCardCheckoutSandbox({agencyId}:{agencyId:string}){
 const [ready,setReady]=useState(false);
 const [busy,setBusy]=useState(false);
 const [mounted,setMounted]=useState(false);
 const [message,setMessage]=useState("");
 const [tier,setTier]=useState<Tier>("STANDARD");
 const [person,setPerson]=useState("");
 const [email,setEmail]=useState("");
 const requestKey=useRef<string|null>(null);
 const elementHost=useRef<HTMLDivElement>(null);
 const checkout=useRef<StripeCheckout|null>(null);
 const element=useRef<{unmount:()=>void}|null>(null);
 const amount=tier==="STANDARD"?1990:2290;

 async function begin(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  if(!ready||busy||mounted||!elementHost.current)return;
  setBusy(true);setMessage("");
  if(!requestKey.current)requestKey.current=crypto.randomUUID();
  try{
   const response=await fetch("/api/payments/stripe/checkout",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({agencyId,requestKey:requestKey.current,tier,personName:person,familyEmail:email})
   });
   const result=await response.json() as SessionResponse;
   if(!response.ok||!result.clientSecret||!result.publishableKey)throw Error(result.error||"Checkout non disponibile.");
   const factory=(window as StripeWindow).Stripe;
   if(!factory)throw Error("Stripe.js non disponibile.");
   const instance=factory(result.publishableKey).initCheckoutElementsSdk({clientSecret:result.clientSecret});
   const paymentElement=instance.createPaymentElement();
   paymentElement.mount(elementHost.current);
   element.current=paymentElement;
   checkout.current=instance;
   setMounted(true);
  }catch(error){setMessage(error instanceof Error?error.message:"Errore durante l'inizializzazione.");}
  finally{setBusy(false);}
 }
 async function confirm(){
  if(!checkout.current||busy)return;
  setBusy(true);setMessage("");
  try{
   const {actions}=await checkout.current.loadActions();
   if(!actions)throw Error("Conferma non disponibile.");
   const result=await actions.confirm();
   if(result.type==="error")throw Error(result.error?.message||"Pagamento non confermato.");
   setMessage("Verifica del pagamento in corso. Il memoriale verrà attivato solo dopo conferma server.");
  }catch(error){setMessage(error instanceof Error?error.message:"Pagamento non riuscito.");}
  finally{setBusy(false);}
 }
 function reset(){
  element.current?.unmount();element.current=null;checkout.current=null;
  requestKey.current=null;setMounted(false);setMessage("");
 }
 return <section className="afm-section" aria-label="Pagamento carta Stripe Sandbox" style={{marginTop:20}}>
  <Script src="https://js.stripe.com/v3/" strategy="afterInteractive" onReady={()=>setReady(true)} onError={()=>setMessage("Impossibile caricare Stripe.js")}/>
  <header><div><span className="workspace-label">STRIPE SANDBOX · SOLO TEST</span>
   <h2>Pagamento con carta in MEMORIAL</h2>
   <p>Il modulo carta viene mostrato direttamente qui. I dati della carta sono trasmessi a Stripe, non a MEMORIAL.</p></div></header>
  <form className="afm-form" onSubmit={begin}>
   <label>Persona commemorata<input required minLength={3} maxLength={180} value={person} disabled={mounted} onChange={e=>{setPerson(e.target.value);requestKey.current=null;}}/></label>
   <label>Email referente famiglia<input required type="email" maxLength={254} value={email} disabled={mounted} onChange={e=>{setEmail(e.target.value);requestKey.current=null;}}/></label>
   <label>Memoriale<select value={tier} disabled={mounted} onChange={e=>{setTier(e.target.value as Tier);requestKey.current=null;}}>
    <option value="STANDARD">Standard — {formatEuro(1990)}</option>
    <option value="PREMIUM">Premium — {formatEuro(2290)}</option>
   </select></label>
   <p>Totale Sandbox: <strong>{formatEuro(amount)}</strong> · nessun addebito reale. Trattamento fiscale definitivo non ancora configurato.</p>
   {!mounted&&<button type="submit" disabled={!ready||busy}>{busy?"Preparazione…":"Inserisci i dati della carta"}</button>}
  </form>
  <div ref={elementHost} style={{padding:mounted?"16px 0":0}}/>
  {mounted&&<div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
   <button type="button" disabled={busy} onClick={()=>void confirm()}>{busy?"Elaborazione…":"Conferma pagamento Sandbox"}</button>
   <button type="button" disabled={busy} onClick={reset}>Annulla</button>
  </div>}
  {message&&<p role="status">{message}</p>}
  <p className="afm-foot">Non usare carte reali. Il pagamento confermato viene registrato nell&apos;ordine; la creazione automatica del memoriale è una fase successiva.</p>
 </section>;
}
