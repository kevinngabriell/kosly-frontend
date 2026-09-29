export interface UpgradePromptProps {
  /** "limit": the free plan's one-kos limit was hit. "readOnly": an extra kos is frozen after a downgrade. */
  reason: "limit" | "readOnly";
  /** Where "back" goes (locale-less path). */
  backHref: string;
}
