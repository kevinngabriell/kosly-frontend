import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getSiteUrl } from "@/lib/site";

// Signed-in and in-flow pages hold personal data and mean nothing to a search engine.
const PRIVATE_PATHS = ["/app", "/verify", "/join", "/invite", "/onboarding"];

// The default locale is served without a prefix; the others live under /<locale>. Each path is blocked both
// exactly (`$`) and as a folder (`/`), which keeps a bare "/app" from also matching "/apple-icon.png".
const disallow = ["", ...routing.locales.filter((l) => l !== routing.defaultLocale).map((l) => `/${l}`)].flatMap(
  (prefix) => PRIVATE_PATHS.flatMap((path) => [`${prefix}${path}$`, `${prefix}${path}/`]),
);

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow },
    sitemap: new URL("/sitemap.xml", getSiteUrl()).toString(),
  };
}
