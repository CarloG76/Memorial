import { notFound } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspaceAccess } from "@/lib/authz/server";
import { isWorkspaceArea } from "@/lib/navigation";

export const dynamic = "force-dynamic";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ area: string }>;
}) {
  const { area } = await params;
  if (!isWorkspaceArea(area)) notFound();
  await requireWorkspaceAccess(area);

  // M1 verifies workspace membership. It still renders NO cross-tenant data,
  // payments, personal contacts, private messages or privileged mutations.
  return (
    <WorkspaceShell area={area}>
      <span className="workspace-label">Milestone M1 · accesso verificato</span>
      <h1>Il tuo ambiente Memorial</h1>
      <p className="muted">
        Il tuo account dispone di un&apos;abilitazione attiva per questo ambiente.
        Le operazioni sui contenuti saranno disponibili solo dopo i controlli
        specifici per agenzia, memoriale, ruolo e stato della risorsa.
      </p>
      <section className="workspace-panel" aria-label="Stato della console">
        <strong>Accesso limitato e tracciabile</strong>
        <p>
          Questa schermata non mostra dati operativi. Per ora non sono disponibili
          acquisti, pubblicazione, gestione privata o accessi trasversali ai tenant.
        </p>
      </section>
    </WorkspaceShell>
  );
}
