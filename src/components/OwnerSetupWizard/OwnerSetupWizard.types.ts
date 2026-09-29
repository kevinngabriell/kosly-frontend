import type { MeDto } from "@/lib/api-types";

export interface OwnerSetupWizardProps {
  /** "first" is onboarding for someone with no kos yet. "add" is adding another kos from inside the app. */
  mode: "first" | "add";
  me: MeDto;
  /** Fires the moment the kos exists, before the success step, so the page can stop its redirect guard. */
  onCreated?: () => void;
}
