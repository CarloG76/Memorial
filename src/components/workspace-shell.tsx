import Link from "next/link";
import { Brand } from "./brand";
import { WORKSPACE_NAV, type WorkspaceArea } from "@/lib/navigation";

const SIDEBAR_ICONS: Record<string,string> = {dashboard:"▦",agenzie:"▤",memoriali:"▣",economia:"◈",statistiche:"▥",assistenza:"◉",impostazioni:"⚙"};
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
                className={index === 0 ? "side-item side-item-selected" : "side-item"}
                href={`/console/piattaforma?sezione=${item.slug}`}
              >
                <span className="sidebar-icon" aria-hidden="true">{SIDEBAR_ICONS[item.slug]??"·"}</span>
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
          <span className="workspace-search"><span aria-hidden="true">⌕</span><span>Cerca agenzie, memoriali, stati…</span></span>
          <div className="workspace-account"><span aria-label="Notifiche non ancora attive">♢</span><span className="workspace-avatar">SA</span><span className="workspace-account-label">{workspaceTitle[area]}</span><Link href="/account/password" aria-label="Cambia password" title="Cambia password">⚿</Link><Link href="/" aria-label="Sito pubblico" title="Sito pubblico">↗</Link></div>
        </header>
        <main className="workspace-content" id="contenuto">
          {children}
        </main>
      </div>
    </div>
  );
}
