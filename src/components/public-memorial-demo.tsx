"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import "./public-memorial-demo.css";

type Memory={title:string;body:string};
type Thought={author:string;body:string};
type Milestone={year:string;title:string;detail:string};
export type DemoMemorial={
 name:string;birth_date:string|null;death_date:string|null;tier:string;
 dedication:string;biography:string;highlights:Milestone[];memories:Memory[];thoughts:Thought[];is_demo:true;
};
type Dialog="contact"|"thought"|"private"|"share"|"propose"|null;
function date(value:string|null){if(!value)return "—";return new Intl.DateTimeFormat("it-IT",{day:"numeric",month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(value+"T12:00:00Z"));}
const portrait="/images/memorial-demo-portrait.jpg";
const choices=[{id:"reminders",label:"Desidero ricevere promemoria per le ricorrenze."},{id:"family",label:"Autorizzo i familiari abilitati a contattarmi via email."},{id:"replies",label:"Desidero ricevere eventuali risposte ai miei contributi."}] as const;
export function PublicMemorialDemo({data}:{data:DemoMemorial}){
 const [dialog,setDialog]=useState<Dialog>(null);
 const [email,setEmail]=useState("");
 const [consents,setConsents]=useState<Record<string,boolean>>({});
 const [notice,setNotice]=useState("");
 const [displayName,setDisplayName]=useState("");
 const [body,setBody]=useState("");
 const years=[data.birth_date?.slice(0,4),data.death_date?.slice(0,4)];
 const open=(next:Dialog)=>{setDialog(next);setNotice("");setBody("");setDisplayName("");setEmail("");setConsents({});};
 function demoSubmit(e:FormEvent<HTMLFormElement>){e.preventDefault();setNotice("Questa è un'anteprima: nessun dato è stato inviato, salvato o inoltrato.");setEmail("");setConsents({});setDisplayName("");setBody("");}
 async function copyLink(){try{await navigator.clipboard.writeText(window.location.href);setNotice("Collegamento copiato.");}catch{setNotice("Copia l’indirizzo dalla barra del browser.");}}
 return <div className="pm-site">
  <div className="pm-demo-ribbon">Anteprima dimostrativa · dati sintetici · nessun invio effettivo</div>
  <header className="pm-header"><Link href="/" className="pm-brand"><span>✦</span> Memorial</Link>
   <nav aria-label="Sezioni del memoriale"><a href="#home">Home</a><a href="#storia">La sua storia</a>{data.tier==="PREMIUM"&&<a href="#ricordi">Ricordi</a>}<a href="#pensieri">Pensieri</a></nav>
   <button className="pm-header-share" type="button" onClick={()=>open("share")}>Condividi <span aria-hidden>↗</span></button>
  </header>
  <main id="contenuto">
   <section className="pm-hero" id="home">
    <div className="pm-hero-portrait" style={{backgroundImage:"linear-gradient(0deg,rgba(6,25,40,.35),transparent 65%),url("+portrait+")"}} role="img" aria-label="Ritratto illustrativo generato artificialmente, non una fotografia reale"/>
    <div className="pm-hero-copy"><span className="pm-overline">IN RICORDO DI</span><h1>{data.name}</h1><p className="pm-life-dates">{date(data.birth_date)} <span>—</span> {date(data.death_date)}</p><span className="pm-gold-stroke"/><blockquote>“{data.dedication}”</blockquote><span className="pm-portrait-note">Ritratto virtuale a scopo dimostrativo</span></div>
    <div className="pm-hero-actions"><button onClick={()=>open("thought")} type="button"><span>♡</span> Lascia un pensiero <b>›</b></button>{data.tier==="PREMIUM"&&<button onClick={()=>open("propose")} type="button"><span>▣</span> Proponi un ricordo <b>›</b></button>}<button onClick={()=>open("private")} type="button"><span>✉</span> Scrivi ai suoi cari <b>›</b></button><button onClick={()=>open("contact")} type="button"><span>♧</span> Rimani in contatto <b>›</b></button></div>
   </section>
   <div className="pm-content">
    <section className="pm-intro"><div><span className="pm-kicker">UNA STORIA DA CUSTODIRE</span><h2>Un ricordo che continua</h2><p>{data.biography}</p></div><div className="pm-intro-symbol">❦<span>Ogni vita lascia tracce di bellezza.</span></div></section>
    <div className="pm-grid"><section id="storia" className="pm-section pm-story"><div className="pm-section-heading"><div><span className="pm-kicker">IL SUO PERCORSO</span><h2>La sua storia</h2></div></div>
      <p>{data.biography}</p><div className="pm-timeline">{data.highlights.map((x,i)=><div key={i}><span>{x.year}</span><div><h3>{x.title}</h3><p>{x.detail}</p></div></div>)}</div>
     </section>
     <div className="pm-right">
      {data.tier==="PREMIUM"&&<section id="ricordi" className="pm-section"><div className="pm-section-heading"><div><span className="pm-kicker">MOMENTI CHE RESTANO</span><h2>Ricordi</h2></div><button onClick={()=>open("propose")} type="button">Proponi un ricordo →</button></div><div className="pm-memory-grid">{data.memories.length?data.memories.map((m,i)=><article className="pm-memory" key={i}><div className={"pm-memory-art pm-art-"+i} aria-hidden><span>✦</span></div><div><h3>{m.title}</h3><p>{m.body}</p></div></article>):<p>Non ci sono ancora ricordi pubblicati.</p>}</div></section>}
      <section id="pensieri" className="pm-section"><div className="pm-section-heading"><div><span className="pm-kicker">PAROLE CHE RESTANO</span><h2>Pensieri e condoglianze</h2></div><button onClick={()=>open("thought")} type="button">Lascia un pensiero →</button></div><p>Un messaggio, un ricordo o un pensiero per chi resta. I contributi sono pubblicati soltanto dopo l'approvazione della famiglia.</p><div className="pm-thought-list">{data.thoughts.length?data.thoughts.map((t,i)=><article className="pm-thought" key={i}><span className="pm-thought-avatar">{t.author.slice(0,1)}</span><div><h3>{t.author}</h3><p>{t.body}</p></div></article>):<p>Non ci sono ancora pensieri pubblicati.</p>}</div></section>
     </div></div>
    <section className="pm-bottom-cta"><div className="pm-cta pm-cta-blue"><span>✉</span><div><h2>Scrivi ai suoi cari</h2><p>Un messaggio privato alla famiglia, sottoposto a moderazione.</p><button type="button" onClick={()=>open("private")}>Scrivi un messaggio →</button></div></div><div className="pm-cta pm-cta-sand"><span>♧</span><div><h2>Rimani in contatto</h2><p>Lascia un recapito solo se lo desideri e scegli per quali finalità.</p><button type="button" onClick={()=>open("contact")}>Gestisci i recapiti →</button></div></div></section>
   </div>
  </main>
  <footer className="pm-footer"><Link href="/" className="pm-brand"><span>✦</span> Memorial</Link><span>Uno spazio per ricordare, condividere, continuare.</span><span>Memoriale dimostrativo · Non indicizzato</span></footer>
  {dialog&&<div className="pm-modal-backdrop" onMouseDown={(e)=>{if(e.target===e.currentTarget)setDialog(null)}}><section className="pm-modal" role="dialog" aria-modal="true" aria-labelledby="pm-modal-heading"><div className="pm-modal-heading"><div><span className="pm-kicker">MEMORIAL · ANTEPRIMA</span><h2 id="pm-modal-heading">{dialog==="contact"?"Rimani in contatto":dialog==="thought"?"Lascia un pensiero":dialog==="private"?"Scrivi ai suoi cari":dialog==="propose"?"Proponi un ricordo":"Condividi questo memoriale"}</h2></div><button aria-label="Chiudi finestra" type="button" onClick={()=>setDialog(null)}>×</button></div>
    {dialog==="share"?<div className="pm-modal-content"><p>Puoi condividere questo memoriale dimostrativo tramite il suo collegamento.</p><button className="pm-primary" onClick={copyLink} type="button">Copia collegamento</button></div>:<form className="pm-modal-content" onSubmit={demoSubmit}>
     {dialog==="contact"?<><p>La tua email è facoltativa. Puoi scegliere separatamente quali comunicazioni desideri ricevere.</p><label htmlFor="pm-email">Indirizzo email (facoltativo)</label><input id="pm-email" type="email" placeholder="nome@esempio.it" autoComplete="off" value={email} onChange={e=>setEmail(e.target.value)}/><fieldset><legend>Le tue preferenze</legend>{choices.map(ch=><label key={ch.id} className="pm-check"><input type="checkbox" checked={!!consents[ch.id]} onChange={e=>setConsents(p=>({...p,[ch.id]:e.target.checked}))}/><span>{ch.label}</span></label>)}</fieldset><p className="pm-privacy">Nella versione operativa: verifica dell’email prima di attivare servizi, gestione autonoma e revoca dei consensi. Nessuna opzione è preselezionata. Questa demo non trasmette né memorizza recapiti.</p><button className="pm-primary" type="submit">Visualizza conferma demo</button></>:
     <><p>{dialog==="thought"?"I pensieri vengono sottoposti all'approvazione della famiglia prima di apparire sul memoriale.":dialog==="private"?"I messaggi privati sono visibili soltanto ai familiari abilitati dopo la moderazione, mai nella pagina pubblica.":"Nella versione operativa potrai proporre fotografie, video e storie, soggetti all'approvazione familiare."}</p><label htmlFor="pm-name">Nome o firma</label><input id="pm-name" maxLength={100} required value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Il tuo nome"/><label htmlFor="pm-text">{dialog==="propose"?"Descrivi il ricordo":"Il tuo messaggio"}</label><textarea id="pm-text" maxLength={1000} rows={5} value={body} onChange={e=>setBody(e.target.value)} required placeholder="Scrivi qui…"/><p className="pm-privacy">Dimostrazione UX: nulla viene inviato o pubblicato.</p><button className="pm-primary" type="submit">Visualizza conferma demo</button></>}
    </form>}
    {notice&&<div className="pm-notice" role="status">{notice}</div>}
   </section></div>}
 </div>;
}
