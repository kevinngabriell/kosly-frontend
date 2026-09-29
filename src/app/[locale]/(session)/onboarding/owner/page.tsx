import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildNoIndexMetadata } from "@/lib/seo";
import { OwnerOnboardingView } from "./_components/OwnerOnboardingView";

export async function generateMetadata({ params }: PageProps<"/[locale]/onboarding/owner">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ownerSetup.metadata" });
  return buildNoIndexMetadata({ title: t("title") });
}

export default async function OwnerOnboardingPage({ params }: PageProps<"/[locale]/onboarding/owner">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <OwnerOnboardingView />;
}
