"use client";
import {useCallback,useEffect,useMemo,useState,type FormEvent} from "react";
import {createBrowserSupabaseClient} from "@/lib/supabase/browser";
import {memorialGallerySrc} from "@/lib/memorial-portrait-url";

type Photo={id:string;title:string;subtitle:string;image_url:string;position:number};
export function FamilyGalleryEditor({memorialId,personName,contextKey}:{memorialId:string;personName:string;contextKey?:string}){
 const db=useMemo(()=>createBrowserSupabaseClient(),[]);
 const [photos,setPhotos]=useState<Photo[]>([]);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const [edit,setEdit]=useState<Photo|null>(null);
 const [title,setTitle]=useState("");
 const [subtitle,setSubtitle]=useState("");
 const [position,setPosition]=useState(1);
 const [file,setFile]=useState<File|null>(null);
 const [savedKey,setSavedKey]=useState<string|null>(null);
 const [rightsConfirmed,setRightsConfirmed]=useState(false);
 const currentKey=edit?.image_url.match(/\/memorial-gallery\/(.+)$/)?.[1]??null;
 const load=useCallback(async()=>{
  setLoading(true);
  const r=await db.rpc("family_gallery_list",{target_memorial:memorialId,context_key:contextKey??null});
  if(r.error){setError("Impossibile caricare la galleria: "+r.error.message);}
  else {setPhotos(r.data as Photo[]);setError("");}
  setLoading(false);
 },[db,memorialId,contextKey]);
 useEffect(()=>{void load();},[load]);
 function startEdit(p:Photo){setEdit(p);setTitle(p.title);setSubtitle(p.subtitle);setPosition(p.position);setFile(null);setSavedKey(null);setRightsConfirmed(false);setMessage("");setError("");}
 function reset(){setEdit(null);setTitle("");setSubtitle("");setPosition(Math.min(99,photos.length+1));setFile(null);setSavedKey(null);setRightsConfirmed(false);}
 function choose(f:File|null){
  setError("");
  if(!f){setFile(null);return;}
  if(!["image/jpeg","image/png","image/webp"].includes(f.type)||f.size<1||f.size>5*1024*1024){
   setFile(null);setError("Sono accettate solo fotografie JPG, PNG o WebP fino a 5 MB.");return;
  }
  setFile(f);setSavedKey(null);
 }
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  if(busy||!rightsConfirmed||(!file&&!currentKey))return;
  setBusy(true);setMessage("");setError("");
  let key=savedKey??currentKey;
  if(file&&!savedKey){
    const ext=file.type==="image/jpeg"?"jpg":file.type==="image/png"?"png":"webp";
    key=memorialId+"/"+crypto.randomUUID()+"."+ext;
    const uploaded=await db.storage.from("memorial-gallery").upload(key,file,{contentType:file.type,upsert:false});
    if(uploaded.error){setError("Upload non riuscito: "+uploaded.error.message);setBusy(false);return;}
    setSavedKey(key);
  }
  const r=await db.rpc("family_gallery_save",{target_memorial:memorialId,context_key:contextKey??null,photo_id:edit?.id??null,
   photo_title:title.trim(),photo_subtitle:subtitle.trim(),photo_key:key,photo_position:position});
  setBusy(false);
  if(r.error){setError("Salvataggio non riuscito: "+r.error.message);return;}
  reset();setMessage("Fotografia salvata nella galleria.");await load();
 }
 async function remove(p:Photo){
  if(busy||!window.confirm("Rimuovere questa fotografia dalla galleria?"))return;
  setBusy(true);setError("");setMessage("");
  const r=await db.rpc("family_gallery_delete",{target_memorial:memorialId,context_key:contextKey??null,photo_id:p.id});
  setBusy(false);if(r.error){setError("Impossibile rimuovere la fotografia: "+r.error.message);return;}
  const imageKey=p.image_url.match(/\/memorial-gallery\/(.+)$/)?.[1];
  const cleanup=imageKey?await db.storage.from("memorial-gallery").remove([imageKey]):null;
  reset();setMessage(cleanup?.error
   ?"Fotografia rimossa dalla galleria, ma il file non è stato eliminato dallo Storage: "+cleanup.error.message
   :"Fotografia rimossa dalla galleria.");await load();
 }
 return <section className="workspace-panel" aria-label={"Galleria fotografica di "+personName} style={{marginBlock:18}}>
  <h2>Galleria fotografica · {personName}</h2>
  <p>Gestisci fotografie, ordine e descrizioni. Nella pagina dei visitatori saranno mostrate soltanto dopo la pubblicazione del memoriale. Attenzione: per ora chi conosce l'URL diretto del file può accedervi anche prima della pubblicazione; non caricare immagini riservate.</p>
  {loading?<p>Caricamento fotografie…</p>:
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:12}}>
    {photos.map(p=><article key={p.id} style={{border:"1px solid #d5dce1",borderRadius:9,padding:11}}>
     <img src={memorialGallerySrc(p.image_url)} alt={p.title} style={{width:"100%",height:145,objectFit:"cover",borderRadius:6}}/>
     <strong style={{display:"block",marginTop:8}}>{p.position}. {p.title}</strong><p>{p.subtitle}</p>
     <div style={{display:"flex",gap:8}}><button type="button" disabled={busy} onClick={()=>startEdit(p)}>Modifica</button><button type="button" disabled={busy} onClick={()=>void remove(p)}>Rimuovi</button></div>
    </article>)}
   </div>}
  {!loading&&photos.length===0&&<p>Nessuna fotografia nella galleria.</p>}
  <form onSubmit={e=>void submit(e)} style={{display:"grid",gap:12,maxWidth:650,marginTop:20}}>
   <h3>{edit?"Modifica fotografia":"Aggiungi fotografia"}</h3>
   <label>Titolo<input required minLength={2} maxLength={120} value={title} onChange={e=>setTitle(e.target.value)}/></label>
   <label>Descrizione<input maxLength={350} value={subtitle} onChange={e=>setSubtitle(e.target.value)}/></label>
   <label>Ordine<input required type="number" min={1} max={99} value={position} onChange={e=>setPosition(Number(e.target.value))}/></label>
   <label>Fotografia (JPG, PNG o WebP, massimo 5 MB)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>choose(e.target.files?.[0]??null)}/></label>
   <label style={{display:"flex",alignItems:"flex-start",gap:8}}><input type="checkbox" checked={rightsConfirmed} onChange={e=>setRightsConfirmed(e.target.checked)}/> Confermo di avere il diritto di condividere questa fotografia nel memoriale e di aver compreso la visibilità del file.</label>
   <div style={{display:"flex",gap:10}}><button disabled={busy||!rightsConfirmed||(!file&&!currentKey)} type="submit">{busy?"Salvataggio…":edit?"Salva modifiche":"Aggiungi alla galleria"}</button>
   {edit&&<button type="button" disabled={busy} onClick={reset}>Annulla</button>}</div>
  </form>
  {error&&<p role="alert" style={{color:"#a02e30"}}>{error}</p>}
  {message&&<p role="status">{message}</p>}
 </section>;
}
