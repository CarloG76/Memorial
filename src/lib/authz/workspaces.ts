import type { WorkspaceArea } from "@/lib/navigation";

export type PlatformRole = "OWNER" | "ADMIN" | "FINANCE" | "SUPPORT";
export type AgencyRole = "OWNER" | "OPERATOR";
export type FamilyRole = "OWNER" | "EDITOR" | "VIEWER";

export type WorkspaceMemberships = Readonly<{
  platformRoles: readonly PlatformRole[];
  agencyCount: number;
  familyCount: number;
}>;

export const EMPTY_WORKSPACE_MEMBERSHIPS: WorkspaceMemberships = {
  platformRoles: [],
  agencyCount: 0,
  familyCount: 0,
};

export function canOpenWorkspace(
  area: WorkspaceArea,
  membership: WorkspaceMemberships,
): boolean {
  switch (area) {
    case "piattaforma":
      return membership.platformRoles.length > 0;
    case "agenzia":
      return membership.agencyCount > 0;
    case "famiglia":
      return membership.familyCount > 0;
  }
}

export function visibleWorkspaces(membership: WorkspaceMemberships): WorkspaceArea[] {
  const areas: WorkspaceArea[] = ["piattaforma", "agenzia", "famiglia"];
  return areas.filter((area) => canOpenWorkspace(area, membership));
}
