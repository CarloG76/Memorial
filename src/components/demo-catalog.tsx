import Link from "next/link";
import { getDemoCatalog } from "@/features/catalog/demo-server";
import { setCatalogDemoFilter } from "@/app/console/catalog-actions";

const statuses: Record<string,string> = {
 DRAFT:"Bozza", PAYMENT_PENDING:"Pagamento in attesa", SKELETON_ACTIVE:"Skeleton attivo",
 FAMILY_PREPARING:"In preparazione", READY_FOR_PUBLICATION:"Pronto a pubblicare",
 PUBLISHED_ACTIVE:"Pubblicato", PRESERVED_STATIC:"Conservato", EXPIRED:"Scaduto",
 UNPUBLISHED_ARCHIVED:"Archiviato non pubblicato", ARCHIVED:"Archiviato",
 CLOSED:"Chiuso", SUSPENDED:"Sospeso"
};
type View = "dashboard"|"agenzie"|"memoriali";
type Filter="ALL"|"ONLY_DEMO"|"NO_DEMO";
function matches(isDemo:boolean,filter:Filter) {
 return filter==="ALL" || (filter==="ONLY_DEMO" ? isDemo : !isDemo);
}
function DemoCell({demo}:{demo:boolean}){
 return demo?<span className="catalog-demo-tag">Sì</span>:<span>No</span>;
}
export async function DemoCatalog({view,query,userId}:{view:View;query:string;userId:string}) {
 const {agencies,memorials,preference}=await getDemoCatalog(userId);
 const agencyById=new Map(agencies.map(a=>[a.id,a.legal_name]));
 const needle=query.trim().toLocaleLowerCase("it");
 const shownAgencies=agencies.filter(a=>matches(a.is_demo,preference) &&
   (!needle || `${a.legal_name} ${a.city??""} ${a.demo_code??""}`.toLocaleLowerCase("it").includes(needle)));
 const shownMemorials=memorials.filter(m=>matches(m.is_demo,preference) &&
   (!needle || `${m.deceased_name??""} ${m.demo_code??""} ${agencyById.get(m.agency_id)??""}`.toLocaleLowerCase("it").includes(needle)));
 const tabs:readonly {key:View;name:string}[]=[
  {key:"dashboard",name:"Panoramica"},{key:"agenzie",name:"Agenzie"},{key:"memoriali",name:"Memoriali"}
 ];
 return <>
  <header className="sa-heading"><div><span className="sa-eyebrow">MEMORIAL / SUPERADMIN</span><h1>{view==="dashboard"?"Dashboard":view==="agenzie"?"Agenzie":"Memoriali"}</h1><p>{view==="dashboard"?"La panoramica della piattaforma":view==="agenzie"?"Gestisci le agenzie, i piani attivi e i memoriali.":"Tutti i memoriali della piattaforma."}</p></div><span className="sa-live"><span/> Dati Supabase</span></header>
  <form action={setCatalogDemoFilter} className="sa-toolbar"><input type="hidden" name="sezione" value={view}/><span className="sa-toolbar-heading">Ambiente dati</span><label htmlFor="demo-filter">Visualizza</label><select id="demo-filter" name="demo" defaultValue={preference}><option value="ALL">Tutti</option><option value="ONLY_DEMO">Solo demo</option><option value="NO_DEMO">Solo reali</option></select><button type="submit">Applica filtro</button><span className="sa-toolbar-note">Preferenza salvata nel profilo</span></form>
  {view==="dashboard" ? <>
    <div className="catalog-stats">
      <div className="catalog-metric"><small>Agenzie attive</small><b>{agencies.filter(a=>matches(a.is_demo,preference)&&a.status==="ACTIVE").length}</b></div>
      <div className="catalog-metric"><small>Memoriali pubblicati</small><b>{memorials.filter(m=>matches(m.is_demo,preference)&&m.status==="PUBLISHED_ACTIVE").length}</b></div>
      <div className="catalog-metric"><small>Agenzie Pro</small><b>{agencies.filter(a=>matches(a.is_demo,preference)&&a.plan==="PRO"&&a.status==="ACTIVE").length}</b></div>
      <div className="catalog-metric"><small>Memoriali conservati</small><b>{memorials.filter(m=>matches(m.is_demo,preference)&&m.status==="PRESERVED_STATIC").length}</b></div>
    </div>
    <div className="admin-overview-grid">
      <section className="workspace-panel">
        <div className="catalog-section-head"><h2>Panoramica agenzie</h2><Link href="/console/piattaforma?sezione=agenzie">Vedi tutte →</Link></div>
        <div className="admin-summary-list">
          <div><span>Attive</span><strong>{agencies.filter(a=>matches(a.is_demo,preference)&&a.status==="ACTIVE").length}</strong></div>
          <div><span>Sospese</span><strong>{agencies.filter(a=>matches(a.is_demo,preference)&&a.status==="SUSPENDED").length}</strong></div>
          <div><span>Chiuse</span><strong>{agencies.filter(a=>matches(a.is_demo,preference)&&a.status==="CLOSED").length}</strong></div>
        </div>
      </section>
      <section className="workspace-panel">
        <div className="catalog-section-head"><h2>Situazione memoriali</h2><Link href="/console/piattaforma?sezione=memoriali">Vedi tutti →</Link></div>
        <div className="admin-summary-list">
          <div><span>In preparazione</span><strong>{memorials.filter(m=>matches(m.is_demo,preference)&&["DRAFT","SKELETON_ACTIVE","FAMILY_PREPARING","READY_FOR_PUBLICATION"].includes(m.status)).length}</strong></div>
          <div><span>Scaduti</span><strong>{memorials.filter(m=>matches(m.is_demo,preference)&&m.status==="EXPIRED").length}</strong></div>
          <div><span>Sospesi</span><strong>{memorials.filter(m=>matches(m.is_demo,preference)&&m.status==="SUSPENDED").length}</strong></div>
        </div>
      </section>
    </div>
    <section className="workspace-panel">
      <div className="catalog-section-head"><h2>Richiedono attenzione</h2><Link href="/console/piattaforma?sezione=memoriali">Apri memoriali →</Link></div>
      <div className="admin-attention-grid">
        <Link href="/console/piattaforma?sezione=memoriali"><span className="admin-attention-icon">◷</span><strong>{memorials.filter(m=>matches(m.is_demo,preference)&&m.status==="EXPIRED").length}</strong><span>Memoriali scaduti</span></Link>
        <Link href="/console/piattaforma?sezione=memoriali"><span className="admin-attention-icon">!</span><strong>{memorials.filter(m=>matches(m.is_demo,preference)&&m.status==="PAYMENT_PENDING").length}</strong><span>Pagamenti da verificare</span></Link>
        <Link href="/console/piattaforma?sezione=agenzie"><span className="admin-attention-icon">▣</span><strong>{agencies.filter(a=>matches(a.is_demo,preference)&&a.status==="CLOSED").length}</strong><span>Agenzie chiuse</span></Link>
      </div>
    </section>
  </> : <div className="catalog-stats">
    {view==="agenzie" ? <>
      <div className="catalog-metric"><small>Agenzie totali</small><b>{shownAgencies.length}</b></div>
      <div className="catalog-metric"><small>Pro attive</small><b>{shownAgencies.filter(a=>a.plan==="PRO"&&a.status==="ACTIVE").length}</b></div>
      <div className="catalog-metric"><small>Free attive</small><b>{shownAgencies.filter(a=>a.plan==="FREE"&&a.status==="ACTIVE").length}</b></div>
      <div className="catalog-metric"><small>Inattive</small><b>{shownAgencies.filter(a=>a.status!=="ACTIVE").length}</b></div>
    </> : <>
      <div className="catalog-metric"><small>Memoriali totali</small><b>{shownMemorials.length}</b></div>
      <div className="catalog-metric"><small>Pubblicati</small><b>{shownMemorials.filter(m=>m.status==="PUBLISHED_ACTIVE").length}</b></div>
      <div className="catalog-metric"><small>Da completare</small><b>{shownMemorials.filter(m=>["DRAFT","SKELETON_ACTIVE","FAMILY_PREPARING"].includes(m.status)).length}</b></div>
      <div className="catalog-metric"><small>Scaduti</small><b>{shownMemorials.filter(m=>m.status==="EXPIRED").length}</b></div>
    </>}
  </div>}
  {view!=="dashboard" && <form method="get" action="/console/piattaforma" className="catalog-filters">
    <input type="hidden" name="sezione" value={view}/>
    <label htmlFor="catalog-query">Cerca</label>
    <input id="catalog-query" type="search" name="q" defaultValue={query} placeholder="Nome, codice, agenzia…" />
    <button type="submit">Cerca</button>
    {query&&<Link href={`/console/piattaforma?sezione=${view}`}>Azzera</Link>}
  </form>}
  {(view==="agenzie")&&<section className="workspace-panel" aria-labelledby="agencies-head">
    <div className="catalog-section-head"><h2 id="agencies-head">Agenzie</h2><span>{shownAgencies.length} risultati</span></div>
    <div className="catalog-table-wrap"><table className="catalog-table"><thead>
      <tr><th>Nome</th><th>Città</th><th>Piano</th><th>Stato</th><th>Demo</th><th>Dettagli</th></tr>
    </thead><tbody>{shownAgencies.map(a=><tr key={a.id}>
      <td><Link href={`/console/piattaforma/agenzie/${a.id}`}><strong>{a.legal_name}</strong></Link></td>
      <td>{a.city??"—"}</td><td>{a.plan}</td><td>{a.status}</td><td><DemoCell demo={a.is_demo}/></td>
      <td><Link href={`/console/piattaforma/agenzie/${a.id}`}>Apri →</Link></td>
    </tr>)}</tbody></table></div>{shownAgencies.length===0&&<p>Nessuna agenzia trovata.</p>}
  </section>}
  {view==="agenzie"&&<div className="sa-agency-bottom">
    <section className="workspace-panel"><div className="catalog-section-head"><h2>Memoriali per agenzia</h2><span>Distribuzione</span></div><div className="sa-bars">{shownAgencies.map(a=><div className="sa-bar-row" key={a.id}><span>{a.legal_name}</span><div className="sa-track"><div style={{width:`${memorials.filter(m=>m.agency_id===a.id&&matches(m.is_demo,preference)).length/Math.max(1,memorials.length)*100}%`}}/></div><strong>{memorials.filter(m=>m.agency_id===a.id&&matches(m.is_demo,preference)).length}</strong></div>)}</div></section>
    <section className="workspace-panel"><div className="catalog-section-head"><h2>Agenzie da verificare</h2><span>Stato non attivo</span></div><div className="sa-mini-list">{shownAgencies.filter(a=>a.status!=="ACTIVE").map(a=><Link href={`/console/piattaforma/agenzie/${a.id}`} key={a.id}><strong>{a.legal_name}</strong><small>{a.status}</small><span>→</span></Link>)}{shownAgencies.every(a=>a.status==="ACTIVE")&&<p>Nessuna agenzia da verificare.</p>}</div></section>
    <section className="workspace-panel"><div className="catalog-section-head"><h2>Pagamenti anomali</h2></div><div className="sa-empty-state"><strong>Dati non disponibili</strong><p>Il monitoraggio pagamenti non è ancora collegato.</p></div></section>
  </div>}
  {(view==="memoriali")&&<section className="workspace-panel" aria-labelledby="memorials-head">
    <div className="catalog-section-head"><h2 id="memorials-head">Memoriali</h2><span>{shownMemorials.length} risultati</span></div>
    <div className="catalog-table-wrap"><table className="catalog-table"><thead>
      <tr><th>Persona</th><th>Agenzia</th><th>Tipologia</th><th>Stato</th><th>Demo</th><th>Dettagli</th></tr>
    </thead><tbody>{shownMemorials.map(m=><tr key={m.id}>
      <td><Link href={`/console/piattaforma/memoriali/${m.id}`}><strong>{m.deceased_name??"In preparazione"}</strong></Link></td>
      <td>{agencyById.get(m.agency_id)??"—"}</td><td>{m.tier??"—"}</td>
      <td>{statuses[m.status]??m.status}</td><td><DemoCell demo={m.is_demo}/></td>
      <td><Link href={`/console/piattaforma/memoriali/${m.id}`}>Apri →</Link></td>
    </tr>)}</tbody></table></div>{shownMemorials.length===0&&<p>Nessun memoriale trovato.</p>}
  </section>}
 </>;
}
