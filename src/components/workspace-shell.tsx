import Link from "next/link";
import { Brand } from "./brand";
import { UiIcon } from "./ui-icon";
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
        <p className="workspace-context">Console {workspaceTitle[area]}</p>
        <nav aria-label="Sezioni previste">
          {WORKSPACE_NAV[area].map((item, index) => (
            area === "piattaforma" && ACTIVE_PLATFORM_SECTIONS.has(item.slug) ? (
              <Link
                key={item.slug}
                className={"side-item"}
                href={`/console/piattaforma?sezione=${item.slug}`}
              >
                <span className="sidebar-icon"><UiIcon name={item.slug as "dashboard"|"agenzie"|"memoriali"}/></span>
                {item.label}
              </Link>
            ) : (
              <span
                className="side-item"
                key={item.slug}
                aria-disabled="true"
                title="Attivazione prevista nelle milestone successive"
              >
                <span className="sidebar-icon"><UiIcon name={item.slug as "economia"|"statistiche"|"assistenza"|"impostazioni"}/></span>
                {item.label}
              </span>
            )
          ))}
        </nav>
        <p className="sidebar-footnote">Un luogo di memoria, custodito nel tempo.</p>
      </aside>
      <div className="workspace-main">
        <header className="workspace-topbar">
          <Link href="/console/piattaforma?sezione=agenzie" className="workspace-search"><UiIcon name="search"/><span>Cerca agenzie e memoriali…</span></Link>
          <div className="workspace-account"><span className="workspace-notifications" title="Notifiche: prossima milestone"><UiIcon name="bell" size={19}/></span><span className="workspace-avatar">SA</span><span className="workspace-account-label">{workspaceTitle[area]}</span><Link href="/account/password" aria-label="Cambia password" title="Cambia password"><UiIcon name="shield" size={17}/></Link><Link href="/" aria-label="Sito pubblico" title="Sito pubblico"><UiIcon name="external" size={17}/></Link></div>
        </header>
        <main className="workspace-content" id="contenuto">
          {children}
        </main>
      </div>
    </div>
  );
}
