import type { ReactNode } from "react";

export interface StatusViewProps {
  kind: "loading" | "error" | "notFound";
  title?: string;
  body?: string;
  /** Shown as a button under an error. */
  retryLabel?: string;
  onRetry?: () => void;
  /** Anything extra, usually a link back somewhere safe. */
  action?: ReactNode;
  /** Fill the viewport (page level) instead of just the parent (section level). */
  fullPage?: boolean;
}
