"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import "./public-memorial-demo.css";
import "./public-memorial-fidelity.css";

type Memory={title:string;body:string;author?:string|null;photo_path?:string|null};
type GalleryPhoto={title:string;subtitle:string;image_url:string};
type Thought={author:string;body:string};
type Milestone={date?:string;year?:string;title:string;detail:string};
export type DemoMemorial={
 memorial_id:string;name:string;birth_date:string|null;death_date:string|null;tier:string;
 dedication:string;biography:string;story?:string;highlights:Milestone[];memories:Memory[];thoughts:Thought[];photos:GalleryPhoto[];background_preset:string;background_url:string|null;portrait_url:string|null;portrait_focus_x:number;is_demo:true;
};
type Dialog="contact"|"thought"|"private"|"share"|"propose"|null;
function date(value:string|null){if(!value)return "—";return new Intl.DateTimeFormat("it-IT",{day:"numeric",month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(value+"T12:00:00Z"));}
type SymbolName="heart"|"camera"|"mail"|"users"|"share"|"mountain"|"waves"|"arrow";
function Symbol({name,size=23}:{name:SymbolName;size?:number}){
 const paths={
 heart:<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>,
 camera:<><rect x="3" y="6" width="18" height="15" rx="2"/><path d="m8 6 2-3h4l2 3"/><circle cx="12" cy="13" r="4"/></>,
 mail:<><rect x="2.5" y="4" width="19" height="16" rx="2"/><path d="m3 6 9 7 9-7"/></>,
 users:<><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 5"/></>,
 share:<><circle cx="18" cy="5" r="2"/><circle cx="5" cy="12" r="2"/><circle cx="18" cy="19" r="2"/><path d="m7 11 9-5M7 13l9 5"/></>,
 mountain:<path d="m2 20 7-13 5 8 3-5 5 10H2Z"/>,
 waves:<path d="M2 8c3 0 3 2 6 2s3-2 6-2 3 2 6 2M2 14c3 0 3 2 6 2s3-2 6-2 3 2 6 2"/>,
 arrow:<path d="M5 12h14m-6-6 6 6-6 6"/>
 };
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
const choices=[{id:"reminders",label:"Desidero ricevere promemoria per le ricorrenze."},{id:"family",label:"Autorizzo i familiari abilitati a contattarmi via email."},{id:"replies",label:"Desidero ricevere eventuali risposte ai miei contributi."}] as const;
export function PublicMemorialDemo({data}:{data:DemoMemorial}){
 const [dialog,setDialog]=useState<Dialog>(null);
 const [email,setEmail]=useState("");
 const [consents,setConsents]=useState<Record<string,boolean>>({});
 const [notice,setNotice]=useState("");
 const [displayName,setDisplayName]=useState("");
 const [body,setBody]=useState("");
 const [photo,setPhoto]=useState<File|null>(null);
 const [photoPreview,setPhotoPreview]=useState("");
 const [photoError,setPhotoError]=useState("");
 const [submitting,setSubmitting]=useState(false);
 const [rightsConfirmed,setRightsConfirmed]=useState(false);
 useEffect(()=>{
  if(!photo){setPhotoPreview("");return;}
  const url=URL.createObjectURL(photo);setPhotoPreview(url);
  return ()=>URL.revokeObjectURL(url);
 },[photo]);
 function selectPhoto(file:File|null){
  setPhotoError("");
  if(!file){setPhoto(null);return;}
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)){
   setPhoto(null);setPhotoError("Formato non supportato: scegli JPG, PNG o WebP.");return;
  }
  if(file.size>5*1024*1024){
   setPhoto(null);setPhotoError("Fotografia troppo grande: massimo 5 MB.");return;
  }
  setPhoto(file);
 }
 const sceneImage=data.background_url??"";
 const portrait=data.portrait_url??"";
 const open=(next:Dialog)=>{setDialog(next);setNotice("");setBody("");setDisplayName("");setEmail("");setConsents({});setPhoto(null);setPhotoError("");setRightsConfirmed(false);};
 async function demoSubmit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  if(dialog!=="propose"){
   setNotice("Questa funzione non è ancora disponibile nella demo; nessun dato è stato inviato.");
   return;
  }
  if(submitting||photoError)return;
  setSubmitting(true);setNotice("");
  try{
   const form=new FormData();
   form.set("memorial_id",data.memorial_id);
   form.set("author",displayName.trim());
   form.set("body",body.trim());
   form.set("rights_confirmed",rightsConfirmed?"yes":"no");
   if(photo)form.set("photo",photo);
   const endpoint=process.env.NEXT_PUBLIC_SUPABASE_URL;
   if(!endpoint)throw new Error("Servizio non configurato.");
   const response=await fetch(endpoint+"/functions/v1/visitor-memory-flow?action=submit",{method:"POST",body:form});
   const result=await response.json();
   if(!response.ok||!result.ok)throw new Error(result.error??"Invio non riuscito.");
   setNotice("Ricordo e fotografia, se allegata, ricevuti. La famiglia di Giovanni Rossi potrà approvarli prima della pubblicazione.");
   setBody("");setPhoto(null);setDisplayName("");
  }catch(error){
   setNotice(error instanceof Error?error.message:"Impossibile inviare il ricordo.");
  }finally{setSubmitting(false);}
 }
 async function copyLink(){try{await navigator.clipboard.writeText(window.location.href);setNotice("Collegamento copiato.");}catch{setNotice("Copia l’indirizzo dalla barra del browser.");}}
 return <div className="pm-site pm-v2">
  <div className="pm-demo-ribbon">Memoriale dimostrativo · le proposte di ricordo vengono inviate alla famiglia per approvazione</div>
  <header className="pm-header"><Link href="/" className="pm-brand"><span>✦</span> Memorial</Link>
   <nav aria-label="Sezioni del memoriale"><a href="#home">Home</a><a href="#storia">La sua storia</a>{data.tier==="PREMIUM"&&<a href="#ricordi">Ricordi</a>}<a href="#pensieri">Pensieri</a></nav>
   <button className="pm-header-share" type="button" onClick={()=>open("share")}><Symbol name="share" size={16}/> Condividi</button>
  </header>
  <main id="contenuto">
   <section className="pm-hero" id="home">
    <div className="pm-hero-scene" style={{backgroundImage:"linear-gradient(90deg,rgba(13,30,49,.18),rgba(12,26,40,.24)),url("+sceneImage+")"}} aria-hidden="true"/>
    {portrait&&<div className="pm-hero-portrait" style={{backgroundImage:"url("+portrait+")",backgroundPosition:`${data.portrait_focus_x??42}% 43%`}} role="img" aria-label="Ritratto commemorativo sfumato sul paesaggio"/>}
    <div className="pm-hero-copy"><span className="pm-overline">IN RICORDO DI</span><h1>{data.name}</h1><p className="pm-life-dates">{date(data.birth_date)} <span>—</span> {date(data.death_date)}</p><span className="pm-gold-stroke"/><blockquote>“{data.dedication}”</blockquote><span className="pm-portrait-note">Memoriale dimostrativo</span></div>
    <div className="pm-hero-actions"><button onClick={()=>open("thought")} type="button"><Symbol name="heart"/> Lascia un pensiero <b>›</b></button>{data.tier==="PREMIUM"&&<button onClick={()=>open("propose")} type="button"><Symbol name="camera"/> Proponi un ricordo <b>›</b></button>}<button onClick={()=>open("private")} type="button"><Symbol name="mail"/> Scrivi ai suoi cari <b>›</b></button><button onClick={()=>open("contact")} type="button"><Symbol name="users"/> Rimani in contatto <b>›</b></button></div>
   </section>
   <div className="pm-content">
    <section className="pm-intro"><div><span className="pm-kicker">UNA STORIA DA CUSTODIRE</span><h2>Un ricordo che continua</h2><p>{data.biography}</p></div><div className="pm-intro-symbol"><Symbol name="mountain" size={45}/><span>La montagna</span><small>Una passione da condividere</small></div></section>
    <div className="pm-grid"><section id="storia" className="pm-section pm-story"><div className="pm-section-heading"><div><span className="pm-kicker">IL SUO PERCORSO</span><h2>La sua storia</h2></div></div>
      <div className="pm-timeline">{data.highlights.map((x,i)=><div key={i}><span>{x.date??x.year}</span><div><h3>{x.title}</h3><p>{x.detail}</p></div></div>)}</div>
     </section>
     <div className="pm-right">
      {data.tier==="PREMIUM"&&<section id="ricordi" className="pm-section"><div className="pm-section-heading"><div><span className="pm-kicker">MOMENTI CHE RESTANO</span><h2>Ricordi</h2></div><button onClick={()=>open("propose")} type="button">Proponi un ricordo →</button></div><div className="pm-photo-intro">Un album di momenti condivisi <span>· Fotografie illustrative della demo</span></div>
      <div className="pm-photo-grid">{data.photos.map((photo,i)=><article key={photo.title+"-"+i} className="pm-photo-card">
       <div className="pm-photo-image" role="img" aria-label={photo.title+", immagine illustrativa"} style={{backgroundImage:"url("+photo.image_url+")"}}/>
       <div className="pm-photo-overlay"><span className="pm-photo-type"><Symbol name="camera" size={13}/> Foto</span><h3>{photo.title}</h3><p>{photo.subtitle}</p></div>
      </article>)}</div>
      {data.memories.length>0&&<div className="pm-memory-stories"><span>RACCONTI CONDIVISI</span>{data.memories.map((m,i)=><article key={i}><h3>{m.title}</h3>{m.author&&<small>Proposto da {m.author}</small>}<p>{m.body}</p>{m.photo_path&&<img style={{maxWidth:"100%",maxHeight:340,objectFit:"contain",borderRadius:10,marginTop:12}} src={process.env.NEXT_PUBLIC_SUPABASE_URL+"/storage/v1/object/public/memorial-approved/"+m.photo_path} alt={"Fotografia del ricordo: "+m.title}/>}</article>)}</div>}</section>}
      <section id="pensieri" className="pm-section"><div className="pm-section-heading"><div><span className="pm-kicker">PAROLE CHE RESTANO</span><h2>Pensieri e condoglianze</h2></div><button onClick={()=>open("thought")} type="button">Lascia un pensiero →</button></div><p>Un messaggio, un ricordo o un pensiero per chi resta. I contributi sono pubblicati soltanto dopo l&apos;approvazione della famiglia.</p><div className="pm-thought-list">{data.thoughts.length?data.thoughts.map((t,i)=><article className="pm-thought" key={i}><div className="pm-thought-top"><span className="pm-thought-avatar">{t.author.slice(0,1)}</span><div><h3>{t.author}</h3><span>Un pensiero condiviso</span></div><Symbol name="heart" size={17}/></div><p>{t.body}</p></article>):<p>Non ci sono ancora pensieri pubblicati.</p>}</div></section>
     </div></div>
    <section className="pm-bottom-cta"><div className="pm-cta pm-cta-blue"><span><Symbol name="mail" size={27}/></span><div><h2>Scrivi ai suoi cari</h2><p>Un messaggio privato alla famiglia, sottoposto a moderazione.</p><button type="button" onClick={()=>open("private")}>Scrivi un messaggio →</button></div></div><div className="pm-cta pm-cta-sand"><span><Symbol name="users" size={28}/></span><div><h2>Rimani in contatto</h2><p>Lascia un recapito solo se lo desideri e scegli per quali finalità.</p><button type="button" onClick={()=>open("contact")}>Gestisci i recapiti →</button></div></div><div className="pm-cta pm-cta-green"><span><Symbol name="heart" size={27}/></span><div><h2>Opere di bene</h2><p>In suo ricordo, un gesto per chi ne ha bisogno.</p><span className="pm-unavailable">Nessuna raccolta attiva</span></div></div></section>
   </div>
  </main>
  <footer className="pm-footer"><Link href="/" className="pm-brand"><span>✦</span> Memorial</Link><span>Uno spazio per ricordare, condividere, continuare.</span><span>Memoriale dimostrativo · Non indicizzato</span></footer>
  {dialog&&<div className="pm-modal-backdrop" onMouseDown={(e)=>{if(e.target===e.currentTarget)setDialog(null)}}><section className="pm-modal" role="dialog" aria-modal="true" aria-labelledby="pm-modal-heading"><div className="pm-modal-heading"><div><span className="pm-kicker">MEMORIAL</span><h2 id="pm-modal-heading">{dialog==="contact"?"Rimani in contatto":dialog==="thought"?"Lascia un pensiero":dialog==="private"?"Scrivi ai suoi cari":dialog==="propose"?"Proponi un ricordo":"Condividi questo memoriale"}</h2></div><button aria-label="Chiudi finestra" type="button" onClick={()=>setDialog(null)}>×</button></div>
    {dialog==="share"?<div className="pm-modal-content"><p>Puoi condividere questo memoriale dimostrativo tramite il suo collegamento.</p><button className="pm-primary" onClick={copyLink} type="button">Copia collegamento</button></div>:<form className="pm-modal-content" onSubmit={demoSubmit}>
     {dialog==="contact"?<><p>La tua email è facoltativa. Puoi scegliere separatamente quali comunicazioni desideri ricevere.</p><label htmlFor="pm-email">Indirizzo email (facoltativo)</label><input id="pm-email" type="email" placeholder="nome@esempio.it" autoComplete="off" value={email} onChange={e=>setEmail(e.target.value)}/><fieldset><legend>Le tue preferenze</legend>{choices.map(ch=><label key={ch.id} className="pm-check"><input type="checkbox" checked={!!consents[ch.id]} onChange={e=>setConsents(p=>({...p,[ch.id]:e.target.checked}))}/><span>{ch.label}</span></label>)}</fieldset><p className="pm-privacy">Nella versione operativa: verifica dell’email prima di attivare servizi, gestione autonoma e revoca dei consensi. Nessuna opzione è preselezionata. Questa demo non trasmette né memorizza recapiti.</p><button className="pm-primary" type="submit">Visualizza conferma demo</button></>:
     <><p>{dialog==="thought"?"I pensieri vengono sottoposti all'approvazione della famiglia prima di apparire sul memoriale.":dialog==="private"?"I messaggi privati sono visibili soltanto ai familiari abilitati dopo la moderazione, mai nella pagina pubblica.":"Puoi aggiungere una fotografia. La proposta sarà inviata realmente ai responsabili della famiglia di Giovanni Rossi, che potranno approvarla o rifiutarla."}</p><label htmlFor="pm-name">Nome o firma</label><input id="pm-name" maxLength={100} required value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Il tuo nome"/><label htmlFor="pm-text">{dialog==="propose"?"Descrivi il ricordo":"Il tuo messaggio"}</label><textarea id="pm-text" maxLength={1000} rows={5} value={body} onChange={e=>setBody(e.target.value)} required placeholder="Scrivi qui…"/>
      {dialog==="propose"&&<div className="pm-photo-upload">
       <label htmlFor="pm-memory-photo">Allega una fotografia (facoltativo)</label>
       <input id="pm-memory-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>selectPhoto(e.target.files?.[0]??null)}/>
       <small>JPG, PNG o WebP · max 5 MB. Nella versione operativa la famiglia approverà la foto prima della pubblicazione.</small>
       {photoError&&<p role="alert" className="pm-photo-error">{photoError}</p>}
       {photoPreview&&<figure className="pm-photo-preview"><img src={photoPreview} alt="Anteprima della fotografia selezionata"/><figcaption>{photo?.name} · pronta per l’invio</figcaption><button type="button" onClick={()=>setPhoto(null)}>Rimuovi fotografia</button></figure>}
      </div>}
      {dialog==="propose"&&<label className="pm-check"><input type="checkbox" checked={rightsConfirmed} onChange={e=>setRightsConfirmed(e.target.checked)} required/><span>Confermo di poter condividere questa fotografia e il ricordo con la famiglia e autorizzo la valutazione per la pubblicazione.</span></label>}
      <p className="pm-privacy">{dialog==="propose"?"Il ricordo rimane privato fino all’approvazione della famiglia.":"Questa funzione è ancora dimostrativa: non salva dati."}</p><button className="pm-primary" type="submit" disabled={submitting||!!photoError||(dialog==="propose"&&!rightsConfirmed)}>{dialog==="propose"?(submitting?"Invio in corso…":"Invia il ricordo alla famiglia"):"Visualizza conferma demo"}</button></>}
    </form>}
    {notice&&<div className="pm-notice" role="status">{notice}</div>}
   </section></div>}
 </div>;
}
