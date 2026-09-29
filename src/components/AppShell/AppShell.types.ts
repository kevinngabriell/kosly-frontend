import type { ReactNode } from "react";
import type { MeDto } from "@/lib/api-types";

export interface AppShellProps {
  me: MeDto;
  activeKosId?: string;
  children: ReactNode;
}
