export type Role = "owner" | "tenant" | "caretaker";

export const ROLES: readonly Role[] = ["owner", "tenant", "caretaker"];

/** Maps a persona to its fixed theme color per the three-pillar system (design doc §4.1). */
export const ROLE_PALETTE: Record<Role, "primary" | "secondary" | "accent"> = {
  owner: "primary",
  tenant: "secondary",
  caretaker: "accent",
};

/** Roles that can be granted through an invite or a join request (an owner is never invited). */
export type JoinableRole = Exclude<Role, "owner">;

export const JOINABLE_ROLES: readonly JoinableRole[] = ["tenant", "caretaker"];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function isJoinableRole(value: unknown): value is JoinableRole {
  return typeof value === "string" && (JOINABLE_ROLES as readonly string[]).includes(value);
}
