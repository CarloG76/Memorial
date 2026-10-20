import "server-only";
import { redirect } from "next/navigation";
import { hasPublicSupabaseConfiguration } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { WorkspaceArea } from "@/lib/navigation";
import {
  canOpenWorkspace,
  type AgencyRole,
  type FamilyRole,
  type PlatformRole,
  type WorkspaceMemberships,
} from "./workspaces";

type IdentityAndMemberships = {
  userId: string;
  workspaces: WorkspaceMemberships;
};

const PLATFORM_ROLES = new Set<PlatformRole>(["OWNER", "ADMIN", "FINANCE", "SUPPORT"]);
const AGENCY_ROLES = new Set<AgencyRole>(["OWNER", "OPERATOR"]);
const FAMILY_ROLES = new Set<FamilyRole>(["OWNER", "EDITOR", "VIEWER"]);

/**
 * Fail closed on a missing configuration, invalid claims or ANY membership
 * query failure. An incomplete migration must never grant access.
 * Role data is read under the signed-in user's JWT and database RLS.
 */
export async function readIdentityAndMemberships(): Promise<IdentityAndMemberships | null> {
  if (!hasPublicSupabaseConfiguration()) return null;

  const client = await createServerSupabaseClient();
  const { data: claimsData, error: claimsError } = await client.auth.getClaims();
  if (claimsError || !claimsData?.claims?.sub) return null;

  const userId = claimsData.claims.sub;
  // Confirm identity and verified email against the Auth service, not editable metadata.
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user || userData.user.id !== userId ||
      !userData.user.email_confirmed_at) return null;

  const [platform, agencies, families] = await Promise.all([
    client.from("platform_memberships").select("role").eq("user_id", userId).eq("active", true),
    client.from("agency_members").select("role").eq("user_id", userId).eq("active", true),
    client.from("family_members").select("role").eq("user_id", userId).eq("active", true),
  ]);

  if (platform.error || agencies.error || families.error) return null;

  // Do not trust JSON returned by an external endpoint to contain only valid roles.
  const platformRoles = (platform.data ?? [])
    .map((item) => item.role)
    .filter((role): role is PlatformRole => PLATFORM_ROLES.has(role as PlatformRole));
  const agencyCount = (agencies.data ?? [])
    .filter((item) => AGENCY_ROLES.has(item.role as AgencyRole)).length;
  const familyCount = (families.data ?? [])
    .filter((item) => FAMILY_ROLES.has(item.role as FamilyRole)).length;

  return { userId, workspaces: { platformRoles, agencyCount, familyCount } };
}

export async function requireWorkspaceAccess(area: WorkspaceArea) {
  const identity = await readIdentityAndMemberships();
  if (!identity) redirect("/accedi");
  if (!canOpenWorkspace(area, identity.workspaces)) {
    redirect("/console?errore=non-autorizzato");
  }
  return identity;
}
