import Link from "next/link";
import { getDemoCatalog } from "@/features/catalog/demo-server";
import { setCatalogDemoFilter } from "@/app/console/catalog-actions";
import { UiIcon } from "./ui-icon";
import "./superadmin-views.css";

type View="dashboard"|"agenzie"|"memoriali";
type Filter="ALL"|"ONLY_DEMO"|"NO_DEMO";
type IconName="agenzie"|"memoriali"|"economia"|"heart"|"clock"|"shield"|"users"|"check";
function IconBadge({name,tone="gold"}:{name:IconName;tone?:string}){return <span className={"ma-icon ma-icon-"+tone}><UiIcon name={name} size={21}/></span>}
const views:Record<View,{title:string;subtitle:string}>={
 dashboard:{title:"Panoramica della piattaforma",subtitle:"Agenzie, memoriali e attività che richiedono attenzione."},
 agenzie:{title:"Agenzie",subtitle:"Gestisci i clienti agenzie, i piani attivi e i memoriali."},
 memoriali:{title:"Memoriali",subtitle:"Tutti i memoriali ospitati sulla piattaforma Memorial."}
};
function Metric({label,value,icon,tone,detail}:{label:string;value:string|number;icon:IconName;tone:string;detail?:string}){
 return <div className="ma-metric"><IconBadge name={icon} tone={tone}/><div className="ma-metric-copy"><span>{label}</span><strong>{value}</strong>{detail&&<small>{detail}</small>}</div></div>;
}
function Pill({value,kind}:{value:string;kind?:"plan"|"state"}){
 let tone=kind==="plan"?(value==="PRO"?"gold":"green"):(value==="ACTIVE"||value==="PUBLISHED_ACTIVE"?"green":value==="SUSPENDED"||value==="EXPIRED"?"red":"muted");
 const label:Record<string,string>={PRO:"Pro",FREE:"Free",ACTIVE:"Attiva",SUSPENDED:"Sospesa",CLOSED:"Chiusa",PUBLISHED_ACTIVE:"Pubblicato",PRESERVED_STATIC:"Conservato",EXPIRED:"Scaduto",FAMILY_PREPARING:"In preparazione",DRAFT:"Bozza",PAYMENT_PENDING:"In attesa pagamento"};
 return <span className={"ma-pill ma-pill-"+tone}>{label[value]??value.replaceAll("_"," ").toLowerCase()}</span>;
}
export async function DemoCatalog({view,query,userId}:{view:View;query:string;userId:string}){
 const {agencies,memorials,preference}=await getDemoCatalog(userId);
 const matches=(d:boolean)=>preference==="ALL"||(preference==="ONLY_DEMO"?d:!d);
 const aa=agencies.filter(a=>matches(a.is_demo));
 const mm=memorials.filter(m=>matches(m.is_demo));
 const byId=new Map(agencies.map(a=>[a.id,a.legal_name]));
 const needle=query.trim().toLocaleLowerCase("it");
 const shownAgencies=aa.filter(a=>!needle||[a.legal_name,a.city??"",a.demo_code??""].join(" ").toLocaleLowerCase("it").includes(needle));
 const shownMemorials=mm.filter(m=>!needle||[m.deceased_name??"",m.demo_code??"",byId.get(m.agency_id)??""].join(" ").toLocaleLowerCase("it").includes(needle));
 const counts=(code:string)=>mm.filter(m=>m.status===code).length;
 const published=counts("PUBLISHED_ACTIVE"), preserved=counts("PRESERVED_STATIC");
 const preparing=mm.filter(m=>["DRAFT","SKELETON_ACTIVE","FAMILY_PREPARING","READY_FOR_PUBLICATION"].includes(m.status)).length;
 const pending=counts("PAYMENT_PENDING"), expired=counts("EXPIRED");
 const agencyCounts=aa.map(a=>({...a,memorialCount:mm.filter(m=>m.agency_id===a.id).length})).sort((a,b)=>b.memorialCount-a.memorialCount);
 const high=Math.max(1,...agencyCounts.map(a=>a.memorialCount));
 const segments=[{n:published,label:"Pubblicati",color:"#123654"},{n:preparing,label:"In preparazione",color:"#d3a467"},{n:preserved,label:"Conservati",color:"#2ca076"},{n:Math.max(0,mm.length-published-preparing-preserved),label:"Altri",color:"#d8dee5"}];
 let offset=0;const stops=segments.map(s=>{const start=offset;offset+=s.n/Math.max(1,mm.length)*100;return s.color+" "+start+"% "+offset+"%"}).join(", ");
 const kpis=view==="dashboard"?[
  ["Agenzie attive",aa.filter(a=>a.status==="ACTIVE").length,"agenzie","gold"],
  ["Memoriali pubblicati",published,"memoriali","green"],
  ["Agenzie Pro",aa.filter(a=>a.status==="ACTIVE"&&a.plan==="PRO").length,"economia","gold"],
  ["Memoriali conservati",preserved,"heart","rose"]
 ] as const:view==="agenzie"?[
  ["Agenzie totali",aa.length,"agenzie","gold"],
  ["Pro attive",aa.filter(a=>a.plan==="PRO"&&a.status==="ACTIVE").length,"economia","gold"],
  ["Free attive",aa.filter(a=>a.plan==="FREE"&&a.status==="ACTIVE").length,"users","green"],
  ["Non attive",aa.filter(a=>a.status!=="ACTIVE").length,"shield","red"]
 ] as const:[
  ["Memoriali totali",mm.length,"memoriali","green"],
  ["Pubblicati",published,"check","green"],
  ["Da completare",preparing,"clock","gold"],
  ["Scaduti",expired,"shield","red"]
 ] as const;
 return <div className="memorial-admin">
  <div className="ma-page-head"><div><span className="ma-page-kicker">CONSOLE SUPERADMIN</span><h1>{views[view].title}</h1><p>{views[view].subtitle}</p></div><span className="ma-source"><i/> Dati Supabase</span></div>
  <div className="ma-kpis">{kpis.map(([label,value,icon,tone])=><Metric key={label} label={label} value={value} icon={icon} tone={tone}/>)}</div>
  {view==="dashboard"&&<>
    <div className="ma-duo">
      <section className="ma-panel ma-graphic"><div className="ma-panel-head"><div><h2>Memoriali pubblicati</h2><p>Distribuzione degli stati correnti</p></div><Link href="/console/piattaforma?sezione=memoriali">Vedi tutti →</Link></div>
       <div className="ma-donut-wrap"><div className="ma-donut" style={{background:"conic-gradient("+stops+")"}}><div><strong>{mm.length}</strong><span>memoriali</span></div></div><div className="ma-legend">{segments.map(s=><div key={s.label}><i style={{background:s.color}}/><span>{s.label}</span><strong>{s.n}</strong></div>)}</div></div>
      </section>
      <section className="ma-panel ma-graphic"><div className="ma-panel-head"><div><h2>Memoriali per agenzia</h2><p>Distribuzione attuale</p></div><Link href="/console/piattaforma?sezione=agenzie">Vedi tutte →</Link></div>
       <div className="ma-bars">{agencyCounts.slice(0,6).map(a=><div className="ma-bar" key={a.id}><span title={a.legal_name}>{a.legal_name}</span><div className="ma-track"><div style={{width:a.memorialCount/high*100+"%"}}/></div><strong>{a.memorialCount}</strong></div>)}</div>
      </section>
    </div>
    <div className="ma-duo ma-short-panels"><section className="ma-panel"><div className="ma-panel-head"><h2>Richiedono attenzione</h2><Link href="/console/piattaforma?sezione=memoriali">Vedi tutti →</Link></div>
     <div className="ma-action-list"><Link href="/console/piattaforma?sezione=memoriali"><IconBadge name="clock" tone="gold"/><strong>{expired}</strong><span>Memoriali scaduti</span><span>›</span></Link><Link href="/console/piattaforma?sezione=memoriali"><IconBadge name="shield" tone="red"/><strong>{pending}</strong><span>Memoriali in attesa di pagamento</span><span>›</span></Link><Link href="/console/piattaforma?sezione=agenzie"><IconBadge name="agenzie" tone="green"/><strong>{aa.filter(a=>a.status!=="ACTIVE").length}</strong><span>Agenzie non attive</span><span>›</span></Link></div>
     </section><section className="ma-panel"><div className="ma-panel-head"><h2>Agenzie della piattaforma</h2><Link href="/console/piattaforma?sezione=agenzie">Vedi tutte →</Link></div><div className="ma-mini">{agencyCounts.slice(0,5).map(a=><Link key={a.id} href={"/console/piattaforma/agenzie/"+a.id}><span className="ma-monogram">{a.legal_name.slice(0,1)}</span><span><strong>{a.legal_name}</strong><small>{a.city??"Città non indicata"}</small></span><Pill value={a.status} kind="state"/></Link>)}</div></section></div>
    <section className="ma-panel ma-reserve"><IconBadge name="shield" tone="gold"/><div><h2>Fondo di continuità e riserva rischi</h2><p>Monitoraggio finanziario non ancora collegato. Non vengono mostrati valori economici stimati.</p></div></section>
  </>}
  {view!=="dashboard"&&<>
    <div className="ma-toolbar"><form method="get" action="/console/piattaforma" className="ma-search"><input type="hidden" name="sezione" value={view}/><UiIcon name="agenzie" size={17}/><input name="q" type="search" aria-label="Ricerca" defaultValue={query} placeholder={view==="agenzie"?"Cerca per agenzia, città o codice…":"Cerca memoriale, agenzia o codice…"} /><button type="submit">Cerca</button></form>
    <form action={setCatalogDemoFilter} className="ma-demo-filter"><input type="hidden" name="sezione" value={view}/><label htmlFor="ma-demo">Dati</label><select name="demo" id="ma-demo" defaultValue={preference}><option value="ALL">Tutti</option><option value="ONLY_DEMO">Solo demo</option><option value="NO_DEMO">Solo reali</option></select><button type="submit">Applica</button></form></div>
    <section className="ma-panel ma-table-panel"><div className="ma-panel-head"><div><h2>{view==="agenzie"?"Elenco agenzie":"Elenco memoriali"}</h2><p>{view==="agenzie"?shownAgencies.length:shownMemorials.length} risultati · seleziona una riga per i dettagli</p></div></div>
     <div className="ma-table-scroll"><table><thead>{view==="agenzie"?<tr><th>Agenzia</th><th>Città</th><th>Piano</th><th>Memoriali</th><th>Stato</th><th>Tipo dati</th><th aria-label="Azioni"/></tr>:<tr><th>Persona</th><th>Agenzia</th><th>Tipo</th><th>Stato</th><th>Visibilità</th><th>Tipo dati</th><th aria-label="Azioni"/></tr>}</thead><tbody>
      {view==="agenzie"?shownAgencies.map(a=><tr key={a.id}><td><Link className="ma-entity" href={"/console/piattaforma/agenzie/"+a.id}><span className="ma-monogram">{a.legal_name.charAt(0)}</span><strong>{a.legal_name}</strong></Link></td><td>{a.city??"—"}</td><td><Pill value={a.plan} kind="plan"/></td><td>{mm.filter(m=>m.agency_id===a.id).length}</td><td><Pill value={a.status} kind="state"/></td><td>{a.is_demo?<span className="ma-demo">Demo</span>:"Reale"}</td><td><Link href={"/console/piattaforma/agenzie/"+a.id}>Apri →</Link></td></tr>):shownMemorials.map(m=><tr key={m.id}><td><Link className="ma-entity" href={"/console/piattaforma/memoriali/"+m.id}><span className="ma-monogram ma-monogram-green"><UiIcon name="memoriali" size={17}/></span><strong>{m.deceased_name??"In preparazione"}</strong></Link></td><td>{byId.get(m.agency_id)??"—"}</td><td><Pill value={m.tier??"STANDARD"} kind="plan"/></td><td><Pill value={m.status} kind="state"/></td><td>{m.visibility==="PUBLIC"?"Pubblico":"Riservato"}</td><td>{m.is_demo?<span className="ma-demo">Demo</span>:"Reale"}</td><td><Link href={"/console/piattaforma/memoriali/"+m.id}>Apri →</Link></td></tr>)}
     </tbody></table></div>{(view==="agenzie"?shownAgencies.length:shownMemorials.length)===0&&<p className="ma-empty">Nessun risultato per i filtri selezionati.</p>}</section>
   </>}
   {view==="agenzie"&&<div className="ma-triplet"><section className="ma-panel"><div className="ma-panel-head"><h2>Agenzie registrate</h2><span>Elenco corrente</span></div><div className="ma-mini">{shownAgencies.slice(0,4).map(a=><Link href={"/console/piattaforma/agenzie/"+a.id} key={a.id}><span className="ma-monogram">{a.legal_name.charAt(0)}</span><span><strong>{a.legal_name}</strong><small>{a.city??"—"}</small></span><span>›</span></Link>)}</div></section><section className="ma-panel"><div className="ma-panel-head"><h2>Da verificare</h2><span>Agenzie non attive</span></div><div className="ma-mini">{shownAgencies.filter(a=>a.status!=="ACTIVE").map(a=><Link href={"/console/piattaforma/agenzie/"+a.id} key={a.id}><IconBadge name="clock" tone="gold"/><span><strong>{a.legal_name}</strong><small>{a.status==="CLOSED"?"Chiusa":"Sospesa"}</small></span><span>›</span></Link>)}{shownAgencies.every(a=>a.status==="ACTIVE")&&<p className="ma-empty">Nessuna agenzia da verificare.</p>}</div></section><section className="ma-panel"><div className="ma-panel-head"><h2>Pagamenti anomali</h2><span>Non disponibile</span></div><div className="ma-unavailable"><IconBadge name="shield" tone="red"/><p>Le transazioni finanziarie non sono ancora collegate a questa sezione.</p></div></section></div>}
 </div>
}
