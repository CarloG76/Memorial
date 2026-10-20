import { describe, expect, it } from "vitest";
import { WORKSPACE_NAV, isWorkspaceArea } from "./navigation";

describe("canonical workspace navigation", () => {
  it("has exactly the approved menu counts", () => {
    expect(WORKSPACE_NAV.piattaforma).toHaveLength(7);
    expect(WORKSPACE_NAV.agenzia).toHaveLength(5);
    expect(WORKSPACE_NAV.famiglia).toHaveLength(7);
  });
  it("rejects arbitrary workspaces", () => {
    expect(isWorkspaceArea("agenzia")).toBe(true);
    expect(isWorkspaceArea("superuser")).toBe(false);
    expect(isWorkspaceArea("__proto__")).toBe(false);
  });
});
