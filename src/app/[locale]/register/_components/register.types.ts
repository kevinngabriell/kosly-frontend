export type Role = "owner" | "tenant" | "caretaker";

export const ROLES: readonly Role[] = ["owner", "tenant", "caretaker"];

/** Maps a persona to its fixed theme color per the three-pillar system (design doc §4.1). */
export const ROLE_PALETTE: Record<Role, "primary" | "secondary" | "accent"> = {
  owner: "primary",
  tenant: "secondary",
  caretaker: "accent",
};
