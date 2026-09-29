import type { ReactNode } from "react";

export interface FlowShellProps {
  children: ReactNode;
  /** Content column width. Defaults to a narrow "lg" column suited to single-task screens. */
  maxW?: "md" | "lg" | "2xl" | "3xl";
}
