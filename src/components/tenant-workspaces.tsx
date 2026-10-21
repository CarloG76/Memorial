import { getAgencyDashboard, getFamilyDashboard } from "@/features/catalog/workspace-server";

const statusLabels:Record<string,string>={
DRAFT:"Bozza",PAYMENT_PENDING:"Pagamento in attesa",SKELETON_ACTIVE:"Skeleton attivo",
FAMILY_PREPARING:"Preparazione famiglia",READY_FOR_PUBLICATION:"Pronto per pubblicazione",
PUBLISHED_ACTIVE:"Pubblicato",PRESERVED_STATIC:"Conservato",EXPIRED:"Scaduto",
UNPUBLISHED_ARCHIVED:"Archiviato non pubblicato",ARCHIVED:"Archiviato",CLOSED:"Chiuso",SUSPENDED:"Sospeso"
};
export async function AgencyWorkspace({userId}:{userId:string}) {
 const {agencies,memorials}=await getAgencyDashboard(userId);
 return <div>
 <span className="workspace-label">Area Agenzia · dati dal database</span>
 <h1>Le tue agenzie</h1>
 <p className="muted">Sono mostrate esclusivamente le agenzie associate al tuo account.</p>
 <div className="catalog-stats">
 <div className="catalog-metric"><small>Agenzie associate</small><b>{agencies.length}</b></div>
 <div className="catalog-metric"><small>Memoriali gestiti</small><b>{memorials.length}</b></div>
 <div className="catalog-metric"><small>Attivi</small><b>{memorials.filter(m=>m.status==="PUBLISHED_ACTIVE").length}</b></div>
 <div className="catalog-metric"><small>In preparazione</small><b>{memorials.filter(m=>["DRAFT","SKELETON_ACTIVE","FAMILY_PREPARING"].includes(m.status)).length}</b></div>
 </div>
 <section className="workspace-panel"><h2>Agenzie</h2><div className="catalog-table-wrap">
 <table className="catalog-table"><thead><tr><th>Nome</th><th>Città</th><th>Piano</th><th>Stato</th></tr></thead><tbody>{agencies.map(a=><tr key={a.id}><td>{a.legal_name}</td><td>{a.city??"—"}</td><td>{a.plan}</td><td>{a.status}</td></tr>)}</tbody></table></div>
 {agencies.length===0&&<p>Nessuna agenzia assegnata.</p>}</section>
 <section className="workspace-panel"><h2>Memoriali</h2><div className="catalog-table-wrap">
 <table className="catalog-table"><thead><tr><th>Persona</th><th>Codice</th><th>Tipo</th><th>Stato</th><th>Demo</th></tr></thead>
 <tbody>{memorials.map(m=><tr key={m.id}><td>{m.deceased_name??"In preparazione"}</td><td>{m.demo_code??"—"}</td><td>{m.tier??"—"}</td><td>{statusLabels[m.status]??m.status}</td><td>{m.is_demo?"Sì":"No"}</td></tr>)}</tbody></table></div>
 {memorials.length===0&&<p>Nessun memoriale assegnato.</p>}</section>
 </div>;
}
export async function FamilyWorkspace({userId}:{userId:string}) {
 const {memorials,memberships}=await getFamilyDashboard(userId);
 const membershipMap=new Map(memberships.map(m=>[m.memorial_id,m]));
 return <div><span className="workspace-label">Area Famiglia · dati dal database</span>
 <h1>I memoriali della tua famiglia</h1><p className="muted">Sono visibili soltanto i memoriali per cui disponi di un ruolo attivo.</p>
 <section className="workspace-panel"><div className="catalog-section-head"><h2>Memoriali associati</h2><span>{memorials.length}</span></div>
 <div className="catalog-table-wrap"><table className="catalog-table"><thead><tr><th>Persona</th><th>Stato</th><th>Ruolo</th><th>Modera</th><th>Modifica</th></tr></thead>
 <tbody>{memorials.map(m=>{const role=membershipMap.get(m.id);return <tr key={m.id}><td><strong>{m.deceased_name??"In preparazione"}</strong></td><td>{statusLabels[m.status]??m.status}</td><td>{role?.role??"—"}</td><td>{role?.can_moderate?"Sì":"No"}</td><td>{role?.can_edit_content?"Sì":"No"}</td></tr>})}</tbody>
 </table></div>{memorials.length===0&&<p>Nessun memoriale assegnato al tuo account.</p>}</section></div>;
}
