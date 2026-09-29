"use client";

import { useLocale } from "next-intl";
import { getPathname } from "@/i18n/navigation";
import type { routing } from "@/i18n/routing";

/** Builds the absolute, shareable link for an invite token in the current language. */
export function useInviteUrl(): (token: string) => string {
  const locale = useLocale() as (typeof routing.locales)[number];
  return (token) => `${window.location.origin}${getPathname({ href: `/invite/${token}`, locale })}`;
}
