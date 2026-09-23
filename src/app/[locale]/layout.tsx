import type { Metadata } from "next";
import { Baloo_2, Inter } from "next/font/google";
import { hasLocale } from "next-intl";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { JsonLd } from "@/components/JsonLd";
import { Provider } from "@/components/ui/provider";
import { buildStructuredData } from "@/lib/seo";
import { COMPANY_NAME, getSiteUrl, SITE_NAME } from "@/lib/site";
import "../globals.css";

const heading = Baloo_2({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});
const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  // Site-wide fields only. Pages set title/description/canonical/openGraph themselves via
  // buildPageMetadata — those merge shallowly, so a canonical set here would leak onto every route.
  return {
    metadataBase: getSiteUrl(),
    title: t("title"),
    description: t("description"),
    applicationName: SITE_NAME,
    keywords: t("keywords").split(",").map((keyword) => keyword.trim()),
    authors: [{ name: COMPANY_NAME }],
    creator: COMPANY_NAME,
    publisher: COMPANY_NAME,
    openGraph: { type: "website", siteName: SITE_NAME },
    twitter: { card: "summary_large_image" },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "metadata" });

  return (
    <html lang={locale} className={`${heading.variable} ${body.variable}`}>
      <body>
        <JsonLd data={buildStructuredData({ locale, description: t("description") })} />
        <NextIntlClientProvider>
          <Provider>{children}</Provider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
