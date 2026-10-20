/**
 * Authorization decisions based on the approved Memorial family role matrix.
 * An access check MUST also verify the memorial scope and authenticated identity.
 */
export type FamilyMembership = Readonly<{
  role: "OWNER" | "EDITOR" | "VIEWER";
  active: boolean;
  can_moderate: boolean;
  can_edit_content: boolean;
  can_view_contacts: boolean;
}>;

export type FamilyAction =
  | "VIEW_MEMORIAL"
  | "EDIT_CONTENT"
  | "MODERATE"
  | "VIEW_CONSENTED_CONTACTS"
  | "APPROVE_PUBLICATION"
  | "MANAGE_MEMBERS";

export function familyMay(member: FamilyMembership | null, action: FamilyAction): boolean {
  if (!member?.active) return false;

  if (action === "VIEW_MEMORIAL") return true;
  if (member.role === "OWNER") return true;
  if (member.role === "VIEWER") return false;

  switch (action) {
    case "EDIT_CONTENT":
      return member.can_edit_content;
    case "MODERATE":
      return member.can_moderate;
    case "VIEW_CONSENTED_CONTACTS":
      return member.can_view_contacts;
    case "APPROVE_PUBLICATION":
    case "MANAGE_MEMBERS":
      return false;
  }
}
