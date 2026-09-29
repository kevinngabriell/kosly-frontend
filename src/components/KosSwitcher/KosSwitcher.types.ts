import type { MembershipDto } from "@/lib/api-types";

export interface KosSwitcherProps {
  memberships: MembershipDto[];
  /** The kos currently open, from the URL. Undefined on the "all kos" overview. */
  activeKosId?: string;
}
