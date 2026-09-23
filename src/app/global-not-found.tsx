import type { Metadata } from "next";
import { Baloo_2, Inter } from "next/font/google";
import { DoorClosed } from "lucide-react";
import { createTranslator } from "next-intl";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import "./globals.css";

const heading = Baloo_2({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});
const bodyFont = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "404 - Page Not Found",
  description: "The page you are looking for does not exist.",
};

// This only renders for URLs that match no route at all (see app/[locale]/not-found.tsx for the
// Chakra-based, locale-aware boundary used for in-app notFound() calls). It bypasses next-intl's
// request-scoped locale detection entirely, so it always renders in the default locale.
const locale = routing.defaultLocale;

// Same blob shape as components/Blob, inlined as plain SVG: mounting Chakra's ChakraProvider
// (and the Emotion <Global> styles it injects) inside this route reproducibly breaks hydration
// here — even a single bare Chakra <Box> reproduces it — so this one page intentionally skips
// Chakra and uses the theme's raw token values (src/theme/system.ts) directly instead.
const BLOB_PATH =
  "M45.3,-58.5C58.5,-49.6,68.8,-34.6,72.6,-17.9C76.4,-1.2,73.7,17.1,64.9,31.6C56.1,46.1,41.2,56.8,24.5,63.2C7.8,69.6,-10.7,71.7,-27.4,66.7C-44.1,61.7,-59,49.6,-67.1,34.1C-75.2,18.6,-76.5,-0.3,-71.1,-16.6C-65.7,-32.9,-53.6,-46.6,-39.2,-55.4C-24.8,-64.2,-8.1,-68.1,7.3,-77.1C22.7,-86.1,45.3,-58.5,45.3,-58.5Z";

export default async function GlobalNotFound() {
  const messages = (await import(`../../messages/${locale}.json`)).default;
  const t = createTranslator({ locale, messages, namespace: "notFound" });
  const homeHref = getPathname({ href: "/", locale });
  const dashboardHref = getPathname({ href: "/dashboard", locale });

  return (
    <html lang={locale} className={`${heading.variable} ${bodyFont.variable}`}>
      <body>
        <style>{`
          .nf-page {
            position: relative;
            overflow: hidden;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #FFF3F1;
            font-family: var(--font-body), sans-serif;
          }
          .nf-blob { position: absolute; pointer-events: none; }
          .nf-blob svg { display: block; width: 100%; height: 100%; }
          .nf-content { position: relative; z-index: 1; max-width: 42rem; padding: 5rem 1.5rem; text-align: center; }
          .nf-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 80px;
            height: 80px;
            margin-bottom: 1.5rem;
            border-radius: 9999px;
            background: #D62F2F;
            color: #fff;
            box-shadow: 0 10px 28px -8px rgba(255, 107, 107, 0.4);
            animation: nf-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
          }
          @media (prefers-reduced-motion: reduce) {
            .nf-badge { animation: none; }
          }
          @keyframes nf-pop {
            from { transform: scale(0.6) rotate(-18deg); opacity: 0; }
            to { transform: scale(1) rotate(-8deg); opacity: 1; }
          }
          .nf-number {
            margin: 0;
            font-family: var(--font-heading), sans-serif;
            font-weight: 800;
            font-size: 96px;
            line-height: 1;
            color: #FF8A7A;
          }
          .nf-headline {
            margin: 1rem 0 0;
            font-family: var(--font-heading), sans-serif;
            font-weight: 800;
            font-size: 28px;
            color: #211D19;
          }
          .nf-body { margin: 0.75rem auto 0; max-width: 28rem; color: #4F473F; font-size: 18px; line-height: 1.6; }
          .nf-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem; margin-top: 2rem; }
          .nf-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 56px;
            padding: 0 2rem;
            border-radius: 9999px;
            font-weight: 600;
            font-size: 16px;
            text-decoration: none;
            transition: transform 0.15s ease, box-shadow 0.15s ease;
          }
          .nf-button-primary { background: #D62F2F; color: #fff; box-shadow: 0 10px 28px -8px rgba(255, 107, 107, 0.4); }
          .nf-button-primary:hover { transform: translateY(-2px); box-shadow: 0 16px 32px -12px rgba(33, 24, 20, 0.18); }
          .nf-button-outline { background: #fff; color: #D62F2F; border: 1px solid #D62F2F; }
          @media (min-width: 768px) {
            .nf-number { font-size: 128px; }
            .nf-headline { font-size: 30px; }
          }
        `}</style>

        <div className="nf-page">
          <div
            className="nf-blob"
            aria-hidden="true"
            style={{ top: "-70px", right: "-60px", width: "300px", height: "300px", color: "#D7F5F2", opacity: 0.8, transform: "rotate(12deg)" }}
          >
            <svg viewBox="0 0 200 200">
              <path fill="currentColor" d={BLOB_PATH} transform="translate(100 100)" />
            </svg>
          </div>
          <div
            className="nf-blob"
            aria-hidden="true"
            style={{ bottom: "-50px", left: "-50px", width: "220px", height: "220px", color: "#FFE8AD", opacity: 0.75, transform: "rotate(-10deg)" }}
          >
            <svg viewBox="0 0 200 200">
              <path fill="currentColor" d={BLOB_PATH} transform="translate(100 100)" />
            </svg>
          </div>

          <div className="nf-content">
            <div className="nf-badge">
              <DoorClosed size={36} strokeWidth={2.25} />
            </div>
            <p className="nf-number">404</p>
            <h1 className="nf-headline">{t("headline")}</h1>
            <p className="nf-body">{t("body")}</p>
            <div className="nf-actions">
              <a className="nf-button nf-button-primary" href={homeHref}>
                {t("homeButton")}
              </a>
              <a className="nf-button nf-button-outline" href={dashboardHref}>
                {t("dashboardButton")}
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
