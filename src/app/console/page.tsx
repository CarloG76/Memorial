import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { readIdentityAndMemberships } from "@/lib/authz/server";
import { visibleWorkspaces } from "@/lib/authz/workspaces";

const LABELS = {
  piattaforma: "Piattaforma Memorial",
  agenzia: "La mia agenzia",
  famiglia: "I miei memoriali",
} as const;

export const dynamic = "force-dynamic";

export default async function WorkspaceChooser() {
  const identity = await readIdentityAndMemberships();
  if (!identity) redirect("/accedi");
  const areas = visibleWorkspaces(identity.workspaces);

  return (
    <>
      <header className="site-header">
        <div className="page-container header-inner"><Brand /></div>
      </header>
      <main id="contenuto" className="auth-page">
        <section className="auth-card" aria-labelledby="workspace-title">
          <span className="section-kicker">ACCESSO MEMORIAL</span>
          <h1 id="workspace-title">Il tuo spazio</h1>
          {areas.length === 0 ? (
            <p role="status">
              Non risultano ancora ruoli attivi associati al tuo account.
              Nessun dato riservato è accessibile.
            </p>
          ) : (
            <>
              <p>Seleziona una delle aree per cui disponi di un&apos;abilitazione.</p>
              <nav aria-label="Aree autorizzate">
                {areas.map((area) => (
                  <p key={area}>
                    <Link className="text-link" href={`/console/${area}`}>
                      {LABELS[area]} →
                    </Link>
                  </p>
                ))}
              </nav>
            </>
          )}
        </section>
      </main>
    </>
  );
}
