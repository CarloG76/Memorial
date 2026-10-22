import { Suspense } from "react";
import { WorkspaceChrome } from "./workspace-chrome";
import type { WorkspaceArea } from "@/lib/navigation";

/**
 * Responsive layout for every authenticated area: OWNER, agency and family.
 * Layout behavior is shared; each screen must also supply its own responsive content.
 */
export function WorkspaceShell({area,children}:{area:WorkspaceArea;children:React.ReactNode}) {
  return <Suspense fallback={<main className="workspace-loading" aria-label="Caricamento area Memorial">Caricamento…</main>}>
    <WorkspaceChrome area={area}>{children}</WorkspaceChrome>
  </Suspense>;
}
