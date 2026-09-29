import { Badge } from "@chakra-ui/react";
import { AlertTriangle, CheckCircle2, Clock, DoorOpen } from "lucide-react";
import type { ReactNode } from "react";
import type { RoomStatus } from "@/lib/api-types";
import type { UnitStatusBadgeProps } from "./UnitStatusBadge.types";

const ICONS: Record<RoomStatus, ReactNode> = {
  vacant: <DoorOpen size={14} aria-hidden="true" />,
  paid: <CheckCircle2 size={14} aria-hidden="true" />,
  due: <Clock size={14} aria-hidden="true" />,
  overdue: <AlertTriangle size={14} aria-hidden="true" />,
};

const PALETTES: Record<RoomStatus, string> = {
  vacant: "gray",
  paid: "green",
  due: "orange",
  overdue: "critical",
};

export function UnitStatusBadge({ status, label }: UnitStatusBadgeProps) {
  return (
    <Badge
      colorPalette={PALETTES[status]}
      variant="subtle"
      borderRadius="full"
      px={2.5}
      py={1}
      gap={1.5}
      whiteSpace="nowrap"
    >
      {ICONS[status]}
      {label}
    </Badge>
  );
}
