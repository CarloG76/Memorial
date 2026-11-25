"use client";
import {useEffect,useMemo,useState} from "react";
import {createBrowserSupabaseClient} from "@/lib/supabase/browser";
import {qrMatrix,qrSvg,QR_SIZE} from "@/lib/memorial-qr";

const PUBLIC_ORIGIN=(process.env.NEXT_PUBLIC_MEMORIAL_CANONICAL_ORIGIN??"https://memorial-ai-visions.vercel.app").replace(/\/$/,"");
type QrRecord={qr_code:string;status:string;memorial_id:string};
function downloadBlob(content:Blob,filename:string){
 const src=URL.createObjectURL(content);
 const anchor=document.createElement("a");anchor.href=src;anchor.download=filename;
 document.body.appendChild(anchor);anchor.click();anchor.remove();
 window.setTimeout(()=>URL.revokeObjectURL(src),5000);
}
export function MemorialQrCard({memorialId,personName,contextKey}:{
 memorialId:string;personName:string;contextKey?:string;
}){
 const db=useMemo(()=>createBrowserSupabaseClient(),[]);
 const [qr,setQr]=useState<QrRecord|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 useEffect(()=>{
  let active=true;
  void Promise.resolve().then(()=>{if(active){setLoading(true);setQr(null);setError("");}});
  void db.rpc("get_memorial_qr",{target_memorial:memorialId,context_key:contextKey??null}).then(({data,error:rpcError})=>{
   if(!active)return;
   if(rpcError){setError("QR Code non disponibile: "+rpcError.message);}
   else if(data&&typeof data==="object"&&/^[0-9a-f]{32}$/.test((data as QrRecord).qr_code)){
    setQr(data as QrRecord);
   }else{setError("Identificativo QR non valido.");}
   setLoading(false);
  });
  return ()=>{active=false;};
 },[db,memorialId,contextKey]);
 const link=qr?PUBLIC_ORIGIN+"/r/"+qr.qr_code:"";
 const svg=useMemo(()=>link?qrSvg(link):"",[link]);
 function svgDownload(){
  if(!svg)return;
  downloadBlob(new Blob([svg],{type:"image/svg+xml;charset=utf-8"}),"memorial-qr-"+memorialId.slice(0,8)+".svg");
  setNotice("QR vettoriale SVG pronto per la stampa.");
 }
 function pngDownload(){
  if(!link)return;
  const matrix=qrMatrix(link);const scale=32;const size=(QR_SIZE+8)*scale;
  const canvas=document.createElement("canvas");canvas.width=size;canvas.height=size;
  const ctx=canvas.getContext("2d");
  if(!ctx){setError("Impossibile preparare il PNG su questo dispositivo.");return;}
  ctx.fillStyle="#ffffff";ctx.fillRect(0,0,size,size);
  ctx.fillStyle="#000000";
  for(let y=0;y<QR_SIZE;y++)for(let x=0;x<QR_SIZE;x++){
   if(matrix[y][x])ctx.fillRect((x+4)*scale,(y+4)*scale,scale,scale);
  }
  canvas.toBlob(blob=>{
   if(blob){downloadBlob(blob,"memorial-qr-"+memorialId.slice(0,8)+".png");setNotice("PNG ad alta risoluzione pronto per la stampa.");}
   else setError("Creazione PNG non riuscita.");
  },"image/png");
 }
 async function copy(){
  if(!link)return;
  try{await navigator.clipboard.writeText(link);setNotice("Link permanente copiato.");}
  catch{setError("Copia automatica non disponibile: seleziona il link e copialo manualmente.");}
 }
 return <section className="workspace-panel" aria-label={"QR Code del memoriale di "+personName} style={{marginBlock:18}}>
  <h2>QR Code per manifesti e ricordini</h2>
  <p>Il codice è univoco e rimane uguale nel tempo. Puoi stamparlo anche prima che il memoriale sia pubblicato: nel frattempo chi lo inquadra vedrà una pagina di attesa, senza contenuti privati.</p>
  {loading?<p>Preparazione QR Code…</p>:qr?
   <div style={{display:"flex",flexWrap:"wrap",gap:18,alignItems:"flex-start"}}>
    <div style={{width:220,background:"#fff",padding:10,border:"1px solid #d7dde3",borderRadius:8}}>
     <img src={"data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg)}
      alt={"QR Code permanente del memoriale di "+personName} width={200} height={200}
      style={{display:"block",width:"100%",height:"auto"}}/>
    </div>
    <div style={{flex:"1 1 245px",minWidth:0}}>
     <strong>Indirizzo permanente</strong>
     <p style={{overflowWrap:"anywhere",fontSize:13}}><a href={link} target="_blank" rel="noopener noreferrer">{link}</a></p>
     <div style={{display:"flex",flexWrap:"wrap",gap:9}}>
      <button type="button" onClick={pngDownload}>Scarica PNG</button>
      <button type="button" onClick={svgDownload}>Scarica SVG</button>
      <button type="button" onClick={()=>void copy()}>Copia link</button>
     </div>
     <p style={{fontSize:13,marginTop:12}}>Testo consigliato sulla stampa: «Inquadra il QR Code per ricordare e condividere un pensiero».</p>
     <p style={{fontSize:13}}>Per una buona lettura, stampa il codice nero su bianco, senza ritagliarlo né eliminare il bordo bianco.</p>
    </div>
   </div>:null}
  {error&&<p role="alert" style={{color:"#a32d35"}}>{error}</p>}
  {notice&&<p role="status">{notice}</p>}
 </section>;
}
