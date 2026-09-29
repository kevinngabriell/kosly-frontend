import type { ReactNode } from "react";

export interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  /** A rendered icon element (not a component reference; it may cross a server/client boundary). */
  icon: ReactNode;
  colorPalette?: "primary" | "secondary" | "accent" | "critical";
}
