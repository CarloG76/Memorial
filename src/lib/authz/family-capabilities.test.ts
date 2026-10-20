import { describe, expect, it } from "vitest";
import { familyMay, type FamilyMembership, type FamilyAction } from "./family-capabilities";

const base: FamilyMembership = {
  role: "VIEWER", active: true,
  can_moderate: false, can_edit_content: false, can_view_contacts: false,
};
const actions: FamilyAction[] = [
  "VIEW_MEMORIAL","EDIT_CONTENT","MODERATE","VIEW_CONSENTED_CONTACTS",
  "APPROVE_PUBLICATION","MANAGE_MEMBERS",
];

describe("Memorial family permissions", () => {
  it("denies all operations when disabled or absent", () => {
    for (const action of actions) {
      expect(familyMay(null, action)).toBe(false);
      expect(familyMay({ ...base, active: false, role: "OWNER" }, action)).toBe(false);
    }
  });
  it("does not grant privileges to VIEWER even if flags are inconsistent", () => {
    const viewer = { ...base, can_moderate: true, can_edit_content: true, can_view_contacts: true };
    expect(actions.filter((a) => familyMay(viewer,a))).toEqual(["VIEW_MEMORIAL"]);
  });
  it("delegates only explicitly granted permissions to EDITOR", () => {
    const editor = { ...base, role: "EDITOR" as const, can_edit_content: true };
    expect(familyMay(editor,"EDIT_CONTENT")).toBe(true);
    expect(familyMay(editor,"MODERATE")).toBe(false);
    expect(familyMay(editor,"VIEW_CONSENTED_CONTACTS")).toBe(false);
    expect(familyMay(editor,"APPROVE_PUBLICATION")).toBe(false);
    expect(familyMay(editor,"MANAGE_MEMBERS")).toBe(false);
  });
  it("allows OWNER to approve publication and manage members", () => {
    const owner = { ...base, role: "OWNER" as const };
    expect(actions.every((a) => familyMay(owner,a))).toBe(true);
  });
});
