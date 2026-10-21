import Link from "next/link";
import { getDemoCatalog } from "@/features/catalog/demo-server";

const statusNames: Record<string,string> = {
  DRAFT:"Bozza",
  PAYMENT_PENDING:"Pagamento in attesa",
  SKELETON_ACTIVE:"Skeleton attivo",
  FAMILY_PREPARING:"Famiglia in preparazione",
  READY_FOR_PUBLICATION:"Pronto alla pubblicazione",
  PUBLISHED_ACTIVE:"Pubblicato",
  PRESERVED_STATIC:"Conservato",
  EXPIRED:"Scaduto",
  UNPUBLISHED_ARCHIVED:"Archiviato senza pubblicazione",
  ARCHIVED:"Archiviato",
  CLOSED:"Chiuso",
  SUSPENDED:"Sospeso",
};
type View = "dashboard" | "agenzie" | "memoriali";

export async function DemoCatalog({
  view, query
}: { view: View; query: string }) {
  const { agencies, memorials } = await getDemoCatalog();
  const agencyById = new Map(agencies.map(a => [a.id,a.legal_name]));
  const filter = query.trim().toLocaleLowerCase("it-IT");
  const visibleAgencies = agencies.filter(a =>
    !filter || `${a.legal_name} ${a.city ?? ""} ${a.demo_code}`.toLocaleLowerCase("it-IT").includes(filter));
  const visibleMemorials = memorials.filter(m =>
    !filter || `${m.deceased_name} ${m.demo_code} ${agencyById.get(m.agency_id) ?? ""}`.toLocaleLowerCase("it-IT").includes(filter));
  const tabs: { key: View; name: string }[] = [
    {key:"dashboard",name:"Panoramica"}, {key:"agenzie",name:"Agenzie demo"},
    {key:"memoriali",name:"Memoriali demo"}
  ];

  return (
    <>
      <div className="catalog-header">
        <div>
          <span className="workspace-label">SuperAdmin · dati reali da PostgreSQL</span>
          <h1>Catalogo dimostrativo</h1>
          <p className="muted">I dati sono letti da Supabase, non dal codice dell&apos;applicazione.</p>
        </div>
        <span className="catalog-demo-tag">DEMO · DATI SINTETICI</span>
      </div>
      <nav className="catalog-tabs" aria-label="Sezioni del catalogo">
        {tabs.map(t => (
          <Link key={t.key} aria-current={view===t.key?"page":undefined}
            className={view===t.key?"catalog-tab catalog-tab-current":"catalog-tab"}
            href={`/console/piattaforma?sezione=${t.key}`}>{t.name}</Link>
        ))}
      </nav>
      <div className="catalog-stats">
        <div className="catalog-metric"><small>Agenzie demo</small><b>{agencies.length}</b></div>
        <div className="catalog-metric"><small>Memoriali demo</small><b>{memorials.length}</b></div>
        <div className="catalog-metric"><small>Agenzie attive</small><b>{agencies.filter(a=>a.status==="ACTIVE").length}</b></div>
        <div className="catalog-metric"><small>Memoriali pubblicati</small><b>{memorials.filter(m=>m.status==="PUBLISHED_ACTIVE").length}</b></div>
      </div>
      {view!=="dashboard" && <form method="get" action="/console/piattaforma" className="catalog-filters">
        <input type="hidden" name="sezione" value={view}/>
        <label htmlFor="catalog-query">Cerca per nome, codice o agenzia</label>
        <input id="catalog-query" type="search" name="q" defaultValue={query} placeholder="Cerca…"/>
        <button type="submit">Cerca</button>
        {query && <Link href={`/console/piattaforma?sezione=${view}`}>Azzera</Link>}
      </form>}
      {(view==="agenzie" || view==="dashboard") && <section className="workspace-panel" aria-labelledby="catalog-agencies">
        <div className="catalog-section-head"><h2 id="catalog-agencies">Agenzie</h2><span>{visibleAgencies.length} risultati</span></div>
        <div className="catalog-table-wrap"><table className="catalog-table">
          <thead><tr><th>Codice</th><th>Ragione sociale</th><th>Città</th><th>Piano</th><th>Stato</th><th>Demo</th></tr></thead>
          <tbody>{visibleAgencies.map(a=><tr key={a.id}>
            <td>{a.demo_code}</td><td><strong>{a.legal_name}</strong></td><td>{a.city}</td>
            <td>{a.plan}</td><td>{a.status==="ACTIVE"?"Attiva":a.status==="CLOSED"?"Chiusa":"Sospesa"}</td>
            <td><span className="catalog-demo-tag">DEMO</span></td>
          </tr>)}</tbody>
        </table></div>
        {visibleAgencies.length===0 && <p>Nessuna agenzia corrisponde alla ricerca.</p>}
      </section>}
      {(view==="memoriali" || view==="dashboard") && <section className="workspace-panel" aria-labelledby="catalog-memorials">
        <div className="catalog-section-head"><h2 id="catalog-memorials">Memoriali</h2><span>{visibleMemorials.length} risultati</span></div>
        <div className="catalog-table-wrap"><table className="catalog-table">
          <thead><tr><th>Codice</th><th>Persona</th><th>Agenzia</th><th>Tier</th><th>Stato</th><th>Demo</th></tr></thead>
          <tbody>{visibleMemorials.map(m=><tr key={m.id}>
            <td>{m.demo_code}</td><td><strong>{m.deceased_name}</strong></td>
            <td>{agencyById.get(m.agency_id)??"—"}</td><td>{m.tier}</td>
            <td>{statusNames[m.status]??m.status}</td>
            <td><span className="catalog-demo-tag">DEMO</span></td>
          </tr>)}</tbody>
        </table></div>
        {visibleMemorials.length===0 && <p>Nessun memoriale corrisponde alla ricerca.</p>}
      </section>}
      <p className="catalog-footnote">Queste statistiche riguardano solo la demo e non sono incluse nei KPI reali. Nessun dato viene modificato da questa pagina.</p>
    </>
  );
}
