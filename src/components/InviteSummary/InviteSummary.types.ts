import type { InvitePreviewDto } from "@/lib/api-types";

export interface InviteSummaryProps {
  preview: InvitePreviewDto;
  /** "banner" is the compact one-liner on the register form; "card" is the full version on the invite page. */
  variant?: "banner" | "card";
}
