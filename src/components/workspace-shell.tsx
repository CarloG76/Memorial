import Link from "next/link";
import { Brand } from "./brand";
import { WORKSPACE_NAV, type WorkspaceArea } from "@/lib/navigation";

const ACTIVE_PLATFORM_SECTIONS = new Set(["dashboard", "agenzie", "memoriali"]);

const workspaceTitle: Record<WorkspaceArea, string> = {
  piattaforma: "SuperAdmin",
  agenzia: "Agenzia",
  famiglia: "Famiglia",
};

export function WorkspaceShell({
  area,
  children,
}: {
  area: WorkspaceArea;
  children: React.ReactNode;
}) {
  return (
    <div className="workspace">
      <aside className="workspace-sidebar" aria-label="Area di lavoro">
        <Brand compact />
        <p className="workspace-context">{workspaceTitle[area]}</p>
        <nav aria-label="Sezioni previste">
          {WORKSPACE_NAV[area].map((item, index) => (
            area === "piattaforma" && ACTIVE_PLATFORM_SECTIONS.has(item.slug) ? (
              <Link
                key={item.slug}
                className={index === 0 ? "side-item side-item-selected" : "side-item"}
                href={`/console/piattaforma?sezione=${item.slug}`}
              >
                <span className="side-item-dot" aria-hidden="true" />
                {item.label}
              </Link>
            ) : (
              <span
                className="side-item"
                key={item.slug}
                aria-disabled="true"
                title="Attivazione prevista nelle milestone successive"
              >
                <span className="side-item-dot" aria-hidden="true" />
                {item.label}
              </span>
            )
          ))}
        </nav>
        <p className="sidebar-footnote">Un luogo di memoria, custodito nel tempo.</p>
      </aside>
      <div className="workspace-main">
        <header className="workspace-topbar">
          <span>Ambiente {workspaceTitle[area]}</span>
          <Link href="/" className="text-link">Torna al sito</Link>
        </header>
        <main className="workspace-content" id="contenuto">
          {children}
        </main>
      </div>
    </div>
  );
}
