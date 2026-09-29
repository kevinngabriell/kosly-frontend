import type { RoomStatus } from "@/lib/api-types";

export interface UnitStatusBadgeProps {
  status: RoomStatus;
  /** Translated status label. Always shown next to the icon so color is never the only signal. */
  label: string;
}
