"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {createBrowserSupabaseClient} from "@/lib/supabase/browser";
import "./family-memorial-publisher.css";

type Check={ready:boolean;issues:string[];name:string;status:string;already_published:boolean;share_token?:string|null};
export function FamilyMemorialPublisher({memorialId,personName}:{memorialId:string;personName:string}){
 const db=useMemo(()=>createBrowserSupabaseClient(),[]);
 const [check,setCheck]=useState<Check|null>(null);
 const [hash,setHash]=useState("");
 const [visibility,setVisibility]=useState<"UNLISTED"|"PUBLIC">("UNLISTED");
 const [approved,setApproved]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [token,setToken]=useState("");
 const [loading,setLoading]=useState(true);
 async function refresh(){
  setLoading(true);setError("");
  const [a,b]=await Promise.all([
   db.rpc("family_publication_check",{target_memorial:memorialId}),
   db.rpc("family_publication_version",{target_memorial:memorialId})
  ]);
  if(a.error||b.error||!a.data||!b.data){setError(a.error?.message??b.error?.message??"Controllo non disponibile");}
  else {const next=a.data as Check;setCheck(next);setToken(next.share_token??"");setHash(String((b.data as {hash:string}).hash));}
  setLoading(false);
 }
 useEffect(()=>{void refresh();},[memorialId,db]);
 async function publish(){
  if(!check?.ready||busy||!approved||!hash)return;
  if(!window.confirm("Confermi la prima pubblicazione del memoriale di "+personName+"? La pagina diventerà accessibile tramite link."))return;
  setBusy(true);setError("");
  const r=await db.rpc("family_publish_memorial",{
   target_memorial:memorialId,selected_visibility:visibility,approval:true,expected_content_hash:hash
  });
  setBusy(false);
  if(r.error){setError("Pubblicazione non riuscita: "+r.error.message);return;}
  const result=r.data as {public_token:string};
  setToken(result.public_token);
  setCheck(p=>p?{...p,already_published:true,status:"PUBLISHED_ACTIVE"}:p);
 }
 const link=token?"/memoriale/p/"+token:"";
 return <section className="fmp">
  <h2>Pubblicazione del memoriale</h2>
  <p>Solo il responsabile familiare può approvare e pubblicare. La pubblicazione non avviene automaticamente al pagamento o al salvataggio dei contenuti.</p>
  {loading?<p>Verifica dei requisiti…</p>:check?.already_published?
   <div><strong>Memoriale pubblicato</strong><p>Il memoriale è stato autorizzato dalla famiglia.</p>
    {link&&<Link href={link} target="_blank" rel="noopener noreferrer">Apri il memoriale pubblico ↗</Link>}
   </div>:
   <>
    <h3>Verifica prima della pubblicazione</h3>
    {check?.ready?<p className="fmp-ready">Requisiti obbligatori verificati.</p>:
     <ul>{(check?.issues??[]).map(issue=><li key={issue}>{issue}</li>)}</ul>}
    <button type="button" className="fmp-secondary" onClick={()=>void refresh()}>Ricontrolla i dati salvati</button>
    <fieldset disabled={!check?.ready||busy}>
     <legend>Visibilità del memoriale</legend>
     <label><input type="radio" name={"visibility-"+memorialId} checked={visibility==="UNLISTED"} onChange={()=>setVisibility("UNLISTED")}/>
      Riservato tramite link: non compare in elenchi pubblici; chi possiede il link può accedere</label>
     <label><input type="radio" name={"visibility-"+memorialId} checked={visibility==="PUBLIC"} onChange={()=>setVisibility("PUBLIC")}/>
      Pubblico: autorizzo la disponibilità anche tramite ricerca e directory quando attivate</label>
     <label className="fmp-consent"><input type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)}/>
      Sono il responsabile familiare e autorizzo la pubblicazione del nome, dei contenuti e delle immagini del memoriale. Confermo di avere i diritti necessari sui materiali pubblicati.</label>
     <button type="button" disabled={!approved||busy||!check?.ready} onClick={()=>void publish()}>{busy?"Pubblicazione…":"Approva e pubblica il memoriale"}</button>
    </fieldset>
   </>
  }
  {error&&<p role="alert" className="fmp-error">{error}</p>}
 </section>;
}
