import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SocialProofStats } from "@/components/SocialProofStats";
import { buildPageMetadata } from "@/lib/seo";
import { Faq } from "./_components/Faq";
import { FinalCta } from "./_components/FinalCta";
import { Hero } from "./_components/Hero";
import { HowItWorks } from "./_components/HowItWorks";
import { Marketing } from "./_components/Marketing";
import { Nav } from "./_components/Nav";
import { Trust } from "./_components/Trust";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return buildPageMetadata({
    locale,
    href: "/",
    title: t("title"),
    description: t("description"),
  });
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Nav />
      <Hero locale={locale} />
      <SocialProofStats />
      <HowItWorks />
      <Trust />
      <Marketing />
      <Faq />
      <FinalCta />
    </>
  );
}
