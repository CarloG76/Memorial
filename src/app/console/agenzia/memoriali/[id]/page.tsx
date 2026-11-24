import Link from "next/link";
import {notFound} from "next/navigation";
import {WorkspaceShell} from "@/components/workspace-shell";
import {memorialStateLabel,memorialStateDescription} from "@/lib/memorial-states";
import {MemorialPortraitUploader} from "@/components/memorial-portrait-uploader";
import {AgencyOpenAsFamilyButton} from "@/components/agency-open-as-family-button";
import {getAgencyDashboard} from "@/features/catalog/workspace-server";
import {requireWorkspaceAccess} from "@/lib/authz/server";

export const dynamic="force-dynamic";
function date(s:string|null){return s?new Date(s).toLocaleDateString("it-IT"):"—";}
export default async function AgencyMemorialDetail({params}:{params:Promise<{id:string}>}){
 const identity=await requireWorkspaceAccess("agenzia");
 const {id}=await params;
 const {agencies,memorials}=await getAgencyDashboard(identity.userId);
 const m=memorials.find(item=>item.id===id);
 if(!m)notFound();
 const agency=agencies.find(a=>a.id===m.agency_id);
 return <WorkspaceShell area="agenzia">
  <Link href="/console/agenzia?sezione=memoriali">← Torna ai memoriali</Link>
  <span className="workspace-label">AGENZIA / MEMORIALI</span>
  <h1>{m.deceased_name??"Memoriale da completare"}</h1>
  <p>{memorialStateDescription(m.status)}</p>
  <Link href={"/memoriale/anteprima/"+m.id} target="_blank" rel="noopener noreferrer">Apri anteprima di {m.deceased_name} ↗</Link>
  <AgencyOpenAsFamilyButton memorialId={m.id}/>
  <MemorialPortraitUploader memorialId={m.id} personName={m.deceased_name??"Persona ricordata"}/>
  <section className="workspace-panel"><h2>Riepilogo</h2>
   <dl className="catalog-details">
    <div><dt>Persona</dt><dd>{m.deceased_name??"Da completare"}</dd></div>
    <div><dt>Agenzia</dt><dd>{agency?.legal_name??"—"}</dd></div>
    <div><dt>Tipologia</dt><dd>{m.tier??"Da scegliere"}</dd></div>
    <div><dt>Stato</dt><dd>{memorialStateLabel(m.status)}</dd></div>
    <div><dt>Visibilità</dt><dd>{m.visibility==="PUBLIC"?"Pubblico":"Riservato"}</dd></div>
    <div><dt>Creato il</dt><dd>{date(m.created_at)}</dd></div>
    <div><dt>Pubblicato il</dt><dd>{date(m.first_published_at)}</dd></div>
    <div><dt>Conservazione fino al</dt><dd>{date(m.covered_until)}</dd></div>
   </dl>
  </section>
  <section className="workspace-panel"><h2>Attività successive</h2>
   <p>La preparazione dei contenuti spetta ai familiari autorizzati. Gli inviti familiari e la creazione di nuovi memoriali richiedono l'attivazione del relativo workflow; questa schermata mostra soltanto dati realmente registrati.</p>
  </section>
 </WorkspaceShell>;
}
