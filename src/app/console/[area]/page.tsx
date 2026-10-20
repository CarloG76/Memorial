import { notFound } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireAuthenticatedIdentity } from "@/lib/auth";
import { isWorkspaceArea } from "@/lib/navigation";

export const dynamic = "force-dynamic";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ area: string }>;
}) {
  const { area } = await params;
  if (!isWorkspaceArea(area)) notFound();
  await requireAuthenticatedIdentity();

  // Important: the user is authenticated, but not yet role-authorized.
  // M0 deliberately renders no tenant data or privileged controls.
  return (
    <WorkspaceShell area={area}>
      <span className="workspace-label">Fondamenta applicative · M0</span>
      <h1>Ambiente in preparazione</h1>
      <p className="muted">
        L&apos;identità è stata verificata. L&apos;abilitazione ai dati e alle funzioni richiederà i controlli
        di ruolo, appartenenza e Row Level Security della milestone M1.
      </p>
      <section className="workspace-panel" aria-label="Stato della console">
        <strong>Nessun dato riservato esposto</strong>
        <p>
          In questa versione i menu sono riferimenti di navigazione non interattivi.
          Non sono ancora disponibili operazioni sui memoriali, pagamenti o dati delle famiglie.
        </p>
      </section>
    </WorkspaceShell>
  );
}
