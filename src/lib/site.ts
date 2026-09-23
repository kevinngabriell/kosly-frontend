export const SITE_NAME = "Kosly";
// The company behind Kosly — surfaced in SEO metadata (authors/creator/publisher) and structured data.
export const COMPANY_NAME = "Movira";

// Origin used to resolve canonical URLs, hreflang alternates, Open Graph images and the sitemap.
// Set NEXT_PUBLIC_SITE_URL to the production domain; on Vercel it falls back to the project's
// production domain, and to localhost in dev.
export function getSiteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return new URL(explicit ?? (vercel ? `https://${vercel}` : "http://localhost:3000"));
}
