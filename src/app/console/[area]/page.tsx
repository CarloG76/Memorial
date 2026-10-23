import { notFound, redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { DemoCatalog } from "@/components/demo-catalog";
import { AgencyWorkspace, FamilyWorkspace } from "@/components/tenant-workspaces";
import { readIdentityAndMemberships, requireWorkspaceAccess } from "@/lib/authz/server";
import { isWorkspaceArea } from "@/lib/navigation";

export const dynamic = "force-dynamic";

export default async function WorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ area: string }>;
  searchParams: Promise<{ sezione?: string; q?: string }>;
}) {
  const { area } = await params;
  if (!isWorkspaceArea(area)) notFound();

  if (area === "piattaforma") {
    const identity = await readIdentityAndMemberships();
    if (!identity) redirect("/accedi");
    // Only the canonical SuperAdmin role may use this cross-agency demo view.
    if (!identity.workspaces.platformRoles.includes("OWNER")) {
      redirect("/console?errore=non-autorizzato");
    }
    const queryParams = await searchParams;
    const view = queryParams.sezione === "agenzie" || queryParams.sezione === "memoriali"
      ? queryParams.sezione
      : "dashboard";
    const q = typeof queryParams.q === "string" ? queryParams.q.slice(0,120) : "";
    return <WorkspaceShell area={area}>
      <DemoCatalog view={view} query={q} userId={identity.userId} />
    </WorkspaceShell>;
  }

  const identity=await requireWorkspaceAccess(area);
  if (area==="agenzia") return <WorkspaceShell area={area}><AgencyWorkspace userId={identity.userId}/></WorkspaceShell>;
  if (area==="famiglia") return <WorkspaceShell area={area}><FamilyWorkspace userId={identity.userId}/></WorkspaceShell>;
  return (
    <WorkspaceShell area={area}>
      <span className="workspace-label">Area autenticata · funzioni in sviluppo</span>
      <h1>Il tuo ambiente Memorial</h1>
      <p className="muted">
        L&apos;accesso è verificato attraverso le membership. Le operazioni sui
        contenuti richiedono autorizzazioni per memoriale e ruoli specifici.
      </p>
      <section className="workspace-panel">
        <strong>Nessun dato trasversale esposto</strong>
        <p>Le aree Agenzia e Famiglia verranno collegate alle proprie risorse
          dopo la verifica dei relativi permessi.</p>
      </section>
    </WorkspaceShell>
  );
}
