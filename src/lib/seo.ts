import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { COMPANY_NAME, getSiteUrl, SITE_NAME } from "./site";

export type AppLocale = (typeof routing.locales)[number];

export const OG_LOCALES: Record<AppLocale, string> = {
  id: "id_ID",
  en: "en_US",
};

// Route params arrive as plain strings; fall back to the default locale rather than throwing inside metadata.
function toAppLocale(locale: string): AppLocale {
  return hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
}

/**
 * Per-page SEO fields. `openGraph` and `alternates` are shallow-merged across route segments, so every
 * page has to set them itself (via this helper) or it would inherit another page's URL and title.
 */
export function buildPageMetadata({
  locale: rawLocale,
  href,
  title,
  description,
}: {
  locale: string;
  href: string;
  title: string;
  description: string;
}): Metadata {
  const locale = toAppLocale(rawLocale);
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, getPathname({ href, locale: l })]),
  );
  const url = getPathname({ href, locale });

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: { ...languages, "x-default": getPathname({ href, locale: routing.defaultLocale }) },
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      url,
      title,
      description,
      locale: OG_LOCALES[locale],
      alternateLocale: routing.locales.filter((l) => l !== locale).map((l) => OG_LOCALES[l]),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** schema.org graph: Movira as the publishing organization, Kosly as its brand and website. */
export function buildStructuredData({
  locale: rawLocale,
  description,
}: {
  locale: string;
  description: string;
}) {
  const locale = toAppLocale(rawLocale);
  const origin = getSiteUrl().origin;
  const organizationId = `${origin}/#organization`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: COMPANY_NAME,
        brand: { "@type": "Brand", name: SITE_NAME },
      },
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        url: new URL(getPathname({ href: "/", locale }), origin).toString(),
        name: SITE_NAME,
        description,
        inLanguage: locale,
        publisher: { "@id": organizationId },
      },
    ],
  };
}
