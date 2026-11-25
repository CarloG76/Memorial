"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {createBrowserSupabaseClient} from "@/lib/supabase/browser";

type Preview={version:string;baseline:Record<string,number>;current:Record<string,number>;limitations:string};
type Result={success:boolean;version:string;restored:Record<string,number>};
const confirmText="RESET DEMO DATA";
export function DemoResetControl(){
 const db=useMemo(()=>createBrowserSupabaseClient(),[]);
 const [preview,setPreview]=useState<Preview|null>(null);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [confirmation,setConfirmation]=useState("");
 const [error,setError]=useState("");
 const [outcome,setOutcome]=useState<Result|null>(null);
 async function refresh(){
  setLoading(true);
  const r=await db.rpc("platform_demo_reset_preview");
  if(r.error){setError(r.error.message);setPreview(null);}
  else{setError("");setPreview(r.data as Preview);}
  setLoading(false);
 }
 useEffect(()=>{void Promise.resolve().then(refresh);},[]); // initial owner-scoped fetch, never mutate on mount
 async function reset(){
  if(busy||confirmation!==confirmText||!preview)return;
  if(!window.confirm("Ripristinare i dati DEMO? Le modifiche a contenuti e anagrafiche DEMO verranno perse. I dati reali non saranno toccati."))return;
  setBusy(true);setError("");setOutcome(null);
  const r=await db.rpc("platform_reset_demo_data",{confirmation:confirmText});
  if(r.error){setError(r.error.message);}
  else{setOutcome(r.data as Result);setConfirmation("");}
  setBusy(false);
  await refresh();
 }
 const card:React.CSSProperties={background:"#fff",border:"1px solid #e2e5e8",borderRadius:13,padding:22,marginBottom:18};
 return <div style={{maxWidth:920}}>
  <Link href="/console/piattaforma?sezione=impostazioni">← Impostazioni</Link>
  <div style={{margin:"22px 0"}}><span className="workspace-label">SUPERADMIN / STRUMENTI DEMO</span><h1>Reset Demo Data</h1>
   <p>Ripristina i dati dimostrativi originali di Memorial. L’operazione riguarda esclusivamente le agenzie e i memoriali DEMO già inclusi nella baseline.</p></div>
  <section style={card} aria-live="polite"><h2>Situazione della demo</h2>
   {loading?<p>Caricamento dati…</p>:preview?<><p>Versione del ripristino: <strong>{preview.version}</strong></p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}>
     {(["agencies","memorials","memories","thoughts","photos"] as const).map(key=><div key={key} style={{background:"#f5f7f9",borderRadius:8,padding:12}}>
      <small>{({agencies:"Agenzie",memorials:"Memoriali",memories:"Ricordi",thoughts:"Pensieri",photos:"Fotografie"})[key]}</small>
      <div style={{fontSize:25,fontWeight:750}}>{preview.current[key]??0}</div>
      <small>Baseline: {preview.baseline[key==="memories"?"memorial_memories":key==="thoughts"?"memorial_thoughts":key==="photos"?"memorial_public_demo_photos":key]??0}</small>
     </div>)}
    </div></>:<p>Impossibile caricare lo stato DEMO.</p>}
  </section>
  <section style={card}><h2>Ripristina la situazione iniziale</h2>
   <p>Vengono riportate ai valori originali le anagrafiche DEMO, i memoriali, le foto, la biografia, i ricordi, i pensieri, le impostazioni visive e le associazioni DEMO. Gli eventuali nuovi pensieri e ricordi DEMO vengono eliminati.</p>
   <p><strong>Non vengono cancellati</strong> account reali, cronologia delle azioni, dati non-DEMO o asset esterni su Storage.</p>
   <p style={{fontSize:13,color:"#6b7280"}}>{preview?.limitations}</p>
   <label htmlFor="demo-reset-confirm" style={{display:"block",fontWeight:650,margin:"18px 0 8px"}}>Scrivi esattamente {confirmText} per confermare</label>
   <input id="demo-reset-confirm" autoComplete="off" value={confirmation} onChange={e=>setConfirmation(e.target.value)}
    style={{width:"100%",maxWidth:440,padding:12,border:"1px solid #aeb6c0",borderRadius:8,display:"block",marginBottom:16}}/>
   <button type="button" onClick={()=>void reset()} disabled={busy||loading||!preview||confirmation!==confirmText}
    style={{background:"#17364f",border:0,color:"white",borderRadius:8,padding:"12px 22px",fontWeight:700,cursor:busy?"wait":"pointer",opacity:busy||loading||!preview||confirmation!==confirmText?.5:1}}>
    {busy?"Ripristino in corso…":"Ripristina tutti i dati DEMO"}</button>
  </section>
  {error&&<p role="alert" style={{color:"#b42318",fontWeight:650}}>{error}</p>}
  {outcome?.success&&<section style={card} role="status"><h2>Ripristino completato</h2>
   <p>Baseline {outcome.version} ripristinata. Le modifiche DEMO sono state annullate; i log di attività sono conservati.</p>
   <ul>{Object.entries(outcome.restored).map(([table,count])=><li key={table}>{table}: {count} record ripristinati</li>)}</ul>
   <Link href="/memoriale/demo" target="_blank">Apri Giovanni Rossi ↗</Link>
  </section>}
 </div>;
}
