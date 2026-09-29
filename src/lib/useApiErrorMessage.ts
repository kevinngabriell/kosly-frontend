"use client";

import { useTranslations } from "next-intl";
import { ApiError } from "./api-client";

/**
 * Turns whatever a failed API call threw into a translated sentence. Known API error codes have their own
 * copy under `apiErrors.<code>`; anything unrecognised falls back to a generic line, and a call that never
 * reached the server gets the "check your connection" line.
 */
export function useApiErrorMessage() {
  const t = useTranslations("apiErrors");

  return (error: unknown): string => {
    if (!(error instanceof ApiError)) return t("network");
    if (!t.has(error.code)) return t("generic");
    return t(error.code, {
      minutes: Math.max(1, Math.ceil((error.body?.retryAfterSeconds ?? 60) / 60)),
      seconds: error.body?.retryAfterSeconds ?? 60,
      attemptsLeft: error.body?.attemptsLeft ?? 0,
    });
  };
}
