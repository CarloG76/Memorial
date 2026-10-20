import { describe, expect, it } from "vitest";
import { canOpenWorkspace, visibleWorkspaces } from "./workspaces";

describe("workspace access (negative by default)", () => {
  it("denies all areas for an unknown user", () => {
    const unknown = { platformRoles: [], agencyCount: 0, familyCount: 0 };
    expect(visibleWorkspaces(unknown)).toEqual([]);
    expect(canOpenWorkspace("piattaforma", unknown)).toBe(false);
    expect(canOpenWorkspace("agenzia", unknown)).toBe(false);
    expect(canOpenWorkspace("famiglia", unknown)).toBe(false);
  });
  it("does not confuse agency and family membership", () => {
    const agent = { platformRoles: [], agencyCount: 1, familyCount: 0 };
    expect(visibleWorkspaces(agent)).toEqual(["agenzia"]);
    expect(canOpenWorkspace("famiglia", agent)).toBe(false);
  });
  it("allows only actually granted environments", () => {
    const both = { platformRoles: ["SUPPORT"] as const, agencyCount: 0, familyCount: 1 };
    expect(visibleWorkspaces(both)).toEqual(["piattaforma", "famiglia"]);
    expect(canOpenWorkspace("agenzia", both)).toBe(false);
  });
});
