import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildNoIndexMetadata } from "@/lib/seo";
import { GuestOnboardingView } from "./_components/GuestOnboardingView";

export async function generateMetadata({ params }: PageProps<"/[locale]/onboarding/guest/[kosId]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "guestOnboarding.metadata" });
  return buildNoIndexMetadata({ title: t("title") });
}

export default async function GuestOnboardingPage({ params }: PageProps<"/[locale]/onboarding/guest/[kosId]">) {
  const { locale, kosId } = await params;
  setRequestLocale(locale);

  return <GuestOnboardingView kosId={kosId} />;
}
