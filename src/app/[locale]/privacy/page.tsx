import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalLayout } from "@/components/LegalLayout";
import { buildPageMetadata } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";

const SECTION_KEYS = [
  "overview",
  "collection",
  "use",
  "sharing",
  "security",
  "retention",
  "rights",
  "cookies",
  "children",
  "changes",
  "contact",
] as const;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.privacy" });

  return buildPageMetadata({
    locale,
    href: "/privacy",
    title: `${t("title")} | ${SITE_NAME}`,
    description: t("intro"),
  });
}

export default async function PrivacyPage({ params }: PageProps<"/[locale]/privacy">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("legal.privacy");
  const tCommon = await getTranslations("notFound");

  const sections = SECTION_KEYS.map((key) => ({
    id: key,
    heading: t(`sections.${key}.heading`),
    body: t(`sections.${key}.body`),
  }));

  return (
    <LegalLayout
      title={t("title")}
      updatedLabel={t("updatedLabel")}
      intro={t("intro")}
      sections={sections}
      backHomeLabel={tCommon("homeButton")}
    />
  );
}
