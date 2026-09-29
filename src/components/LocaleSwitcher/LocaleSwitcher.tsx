"use client";

import { Button, HStack } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import type { LocaleSwitcherProps } from "./LocaleSwitcher.types";

export function LocaleSwitcher({ tone = "plain" }: LocaleSwitcherProps) {
  const t = useTranslations("common.localeName");
  const activeLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(locale: (typeof routing.locales)[number]) {
    if (locale === activeLocale) return;
    // Keep the query string (?invite=, ?next=, ...) so switching language never drops the flow.
    router.replace(`${pathname}${window.location.search}`, { locale });
  }

  return (
    <HStack
      gap={0.5}
      p={0.5}
      borderRadius="full"
      bg={tone === "onColor" ? "white" : "gray.100"}
      boxShadow={tone === "onColor" ? "card" : undefined}
    >
      {routing.locales.map((locale) => {
        const active = locale === activeLocale;
        return (
          <Button
            key={locale}
            type="button"
            size="xs"
            minW="10"
            minH="8"
            borderRadius="full"
            variant={active ? "solid" : "ghost"}
            colorPalette={active ? "primary" : "gray"}
            aria-label={t(locale)}
            aria-pressed={active}
            lang={locale}
            onClick={() => switchTo(locale)}
          >
            {locale.toUpperCase()}
          </Button>
        );
      })}
    </HStack>
  );
}
