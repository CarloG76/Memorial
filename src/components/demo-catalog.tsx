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
  <div className="catalog-header"><div><span className="workspace-label">Piattaforma · SuperAdmin</span>
  <h1>{view==="dashboard"?"Panoramica":view==="agenzie"?"Agenzie":"Memoriali"}</h1>
  <p className="muted">Dati del database Memorial · seleziona una riga per aprire la scheda.</p>
  </div></div>
  <nav className="catalog-tabs" aria-label="Sezioni piattaforma">
    {tabs.map(t=><Link key={t.key} href={`/console/piattaforma?sezione=${t.key}`} aria-current={t.key===view?"page":undefined}
      className={t.key===view?"catalog-tab catalog-tab-current":"catalog-tab"}>{t.name}</Link>)}
  </nav>
  <form action={setCatalogDemoFilter} className="catalog-filters">
    <input type="hidden" name="sezione" value={view}/>
    <label htmlFor="demo-filter">Visualizza</label>
    <select name="demo" id="demo-filter" defaultValue={preference} aria-label="Filtra dati demo">
      <option value="ALL">Tutti</option><option value="ONLY_DEMO">Solo demo</option>
      <option value="NO_DEMO">Senza demo</option>
    </select>
    <button type="submit">Applica e ricorda</button>
    <span className="muted">Preferenza salvata nell&apos;account per i prossimi accessi.</span>
  </form>
  <div className="catalog-stats">
    <div className="catalog-metric"><small>Agenzie visibili</small><b>{agencies.filter(a=>matches(a.is_demo,preference)).length}</b></div>
    <div className="catalog-metric"><small>Memoriali visibili</small><b>{memorials.filter(m=>matches(m.is_demo,preference)).length}</b></div>
    <div className="catalog-metric"><small>Agenzie attive</small><b>{agencies.filter(a=>matches(a.is_demo,preference)&&a.status==="ACTIVE").length}</b></div>
    <div className="catalog-metric"><small>Memoriali pubblicati</small><b>{memorials.filter(m=>matches(m.is_demo,preference)&&m.status==="PUBLISHED_ACTIVE").length}</b></div>
  </div>
  {view!=="dashboard" && <form method="get" action="/console/piattaforma" className="catalog-filters">
    <input type="hidden" name="sezione" value={view}/>
    <label htmlFor="catalog-query">Cerca</label>
    <input id="catalog-query" type="search" name="q" defaultValue={query} placeholder="Nome, codice, agenzia…" />
    <button type="submit">Cerca</button>
    {query&&<Link href={`/console/piattaforma?sezione=${view}`}>Azzera</Link>}
  </form>}
  {(view==="agenzie"||view==="dashboard")&&<section className="workspace-panel" aria-labelledby="agencies-head">
    <div className="catalog-section-head"><h2 id="agencies-head">Agenzie</h2><span>{shownAgencies.length} risultati</span></div>
    <div className="catalog-table-wrap"><table className="catalog-table"><thead>
      <tr><th>Nome</th><th>Città</th><th>Piano</th><th>Stato</th><th>Demo</th><th>Dettagli</th></tr>
    </thead><tbody>{shownAgencies.map(a=><tr key={a.id}>
      <td><Link href={`/console/piattaforma/agenzie/${a.id}`}><strong>{a.legal_name}</strong></Link></td>
      <td>{a.city??"—"}</td><td>{a.plan}</td><td>{a.status}</td><td><DemoCell demo={a.is_demo}/></td>
      <td><Link href={`/console/piattaforma/agenzie/${a.id}`}>Apri →</Link></td>
    </tr>)}</tbody></table></div>{shownAgencies.length===0&&<p>Nessuna agenzia trovata.</p>}
  </section>}
  {(view==="memoriali"||view==="dashboard")&&<section className="workspace-panel" aria-labelledby="memorials-head">
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
