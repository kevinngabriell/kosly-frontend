import type { MetadataRoute } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getSiteUrl } from "@/lib/site";

const PAGES = [
  { href: "/", priority: 1 },
  { href: "/register", priority: 0.8 },
  { href: "/login", priority: 0.5 },
  { href: "/terms", priority: 0.3 },
  { href: "/privacy", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteUrl();
  const absolute = (href: string, locale: (typeof routing.locales)[number]) =>
    new URL(getPathname({ href, locale }), origin).toString();

  return PAGES.flatMap(({ href, priority }) =>
    routing.locales.map((locale) => ({
      url: absolute(href, locale),
      priority,
      alternates: {
        languages: Object.fromEntries(routing.locales.map((l) => [l, absolute(href, l)])),
      },
    })),
  );
}
