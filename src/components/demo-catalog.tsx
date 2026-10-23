import Link from "next/link";
import { UiIcon } from "@/components/ui-icon";
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
  <header className="sa-heading"><div className="sa-heading-copy">
  <span className="sa-eyebrow">MEMORIAL <span aria-hidden="true">/</span> SUPERADMIN</span>
  <h1>{view==="dashboard"?"Dashboard":view==="agenzie"?"Agenzie":"Memoriali"}</h1>
  <p>{view==="dashboard"?"La situazione della piattaforma, in tempo reale.":view==="agenzie"?"Gestisci le agenzie, i piani attivi e i memoriali.":"Tutti i memoriali della piattaforma."}</p></div>
  <div className="sa-heading-actions"><span className="sa-live"><span/> Dati aggiornati da Supabase</span></div></header>
  <form action={setCatalogDemoFilter} className="sa-toolbar">
    <input type="hidden" name="sezione" value={view}/>
    <div className="sa-toolbar-heading"><UiIcon name="shield" size={17}/><span>Ambiente dati</span></div>
    <label className="sa-select-label" htmlFor="demo-filter">Visualizza</label>
    <select name="demo" id="demo-filter" defaultValue={preference}><option value="ALL">Tutti i dati</option><option value="ONLY_DEMO">Solo demo</option><option value="NO_DEMO">Solo reali</option></select>
    <button type="submit">Applica filtro</button>
    <span className="sa-toolbar-note">La preferenza resta salvata nel tuo account</span>
  </form>
  {view==="dashboard" ? <>
    <div className="catalog-stats">
      <div className="catalog-metric"><small>Agenzie attive</small><b>{agencies.filter(a=>matches(a.is_demo,preference)&&a.status==="ACTIVE").length}</b></div>
      <div className="catalog-metric"><small>Memoriali pubblicati</small><b>{memorials.filter(m=>matches(m.is_demo,preference)&&m.status==="PUBLISHED_ACTIVE").length}</b></div>
      <div className="catalog-metric"><small>Agenzie Pro</small><b>{agencies.filter(a=>matches(a.is_demo,preference)&&a.plan==="PRO"&&a.status==="ACTIVE").length}</b></div>
      <div className="catalog-metric"><small>Memoriali conservati</small><b>{memorials.filter(m=>matches(m.is_demo,preference)&&m.status==="PRESERVED_STATIC").length}</b></div>
    </div>
    <div className="sa-analytics-grid">
      <section className="workspace-panel sa-chart-panel">
        <div className="catalog-section-head"><div><h2>Distribuzione dei memoriali</h2><p>Composizione per stato corrente</p></div><Link href="/console/piattaforma?sezione=memoriali">Esplora →</Link></div>
        <div className="sa-chart-body">
          <div className="sa-donut" style={{background:`conic-gradient(#102940 0 ${published/Math.max(1,shownMemorials.length)*100}%,#b48a46 ${published/Math.max(1,shownMemorials.length)*100}% ${(published+preparing)/Math.max(1,shownMemorials.length)*100}%,#23a47b ${(published+preparing)/Math.max(1,shownMemorials.length)*100}% ${(published+preparing+preserved)/Math.max(1,shownMemorials.length)*100}%,#e4eaf1 ${(published+preparing+preserved)/Math.max(1,shownMemorials.length)*100}% 100%)`}}><span><strong>{shownMemorials.length}</strong><small>Memoriali</small></span></div>
          <div className="sa-chart-legend">
            <div><i className="sa-dot sa-navy"/> Pubblicati <strong>{published}</strong></div>
            <div><i className="sa-dot sa-gold"/> In preparazione <strong>{preparing}</strong></div>
            <div><i className="sa-dot sa-green"/> Conservati <strong>{preserved}</strong></div>
            <div><i className="sa-dot sa-gray"/> Altri stati <strong>{shownMemorials.length-published-preparing-preserved}</strong></div>
          </div>
        </div>
      </section>
      <section className="workspace-panel sa-chart-panel">
        <div className="catalog-section-head"><div><h2>Memoriali per agenzia</h2><p>Distribuzione del catalogo</p></div><Link href="/console/piattaforma?sezione=agenzie">Agenzie →</Link></div>
        <div className="sa-bars">{agencyCounts.slice().sort((a,b)=>b.count-a.count).slice(0,6).map(a=><div className="sa-bar-row" key={a.id}><span title={a.legal_name}>{a.legal_name}</span><div className="sa-track"><div style={{width:`${a.count/maxAgencyMemorials*100}%`}}/></div><strong>{a.count}</strong></div>)}</div>
      </section>
    </div>
  {view==="agenzie"&&<div className="sa-agency-filters">
   <div className="sa-filter-pills"><span>Panoramica</span><strong>{shownAgencies.length} agenzie</strong><span className="admin-pill admin-pill-gold">{activeAgencies.filter(a=>a.plan==="PRO").length} Pro attive</span><span className="admin-pill admin-pill-green">{activeAgencies.filter(a=>a.plan==="FREE").length} Free attive</span></div>
   <span className="sa-subtle">Seleziona una riga per aprire il profilo dell’agenzia</span>
  </div>}
  {view==="agenzie"&&<div className="sa-agency-bottom">
   <section className="workspace-panel"><div className="catalog-section-head"><h2>Nuove registrazioni</h2><span>Dal catalogo</span></div>
    <div className="sa-mini-list">{agencyCounts.slice(-4).reverse().map(a=><Link href={`/console/piattaforma/agenzie/${a.id}`} key={a.id}><span className="sa-list-icon"><UiIcon name="agenzie" size={17}/></span><span className="sa-list-copy"><strong>{a.legal_name}</strong><small>{a.city??"Sede non specificata"}</small></span><span>→</span></Link>)}</div>
   </section>
   <section className="workspace-panel"><div className="catalog-section-head"><h2>Agenzie da verificare</h2><span>Stato non attivo</span></div>
    <div className="sa-mini-list">{shownAgencies.filter(a=>a.status!=="ACTIVE").map(a=><Link href={`/console/piattaforma/agenzie/${a.id}`} key={a.id}><span className="sa-list-icon sa-list-amber"><UiIcon name="clock" size={17}/></span><span className="sa-list-copy"><strong>{a.legal_name}</strong><small>{a.status==="CLOSED"?"Chiusa":"Sospesa"}</small></span><span>→</span></Link>)}{!shownAgencies.some(a=>a.status!=="ACTIVE")&&<p className="sa-empty">Nessuna agenzia da verificare.</p>}</div>
   </section>
   <section className="workspace-panel"><div className="catalog-section-head"><h2>Pagamenti anomali</h2><span>Integrazione prevista</span></div><div className="sa-empty-state"><span className="sa-list-icon sa-list-amber"><UiIcon name="shield" size={19}/></span><strong>Monitoraggio non ancora attivo</strong><p>Le transazioni di pagamento non sono ancora collegate a questa dashboard.</p></div></section>
  </div>}

