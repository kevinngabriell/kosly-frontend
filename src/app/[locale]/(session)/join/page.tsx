import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildNoIndexMetadata } from "@/lib/seo";
import { JoinView } from "./_components/JoinView";

export async function generateMetadata({ params }: PageProps<"/[locale]/join">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "join.metadata" });
  return buildNoIndexMetadata({ title: t("title") });
}

export default async function JoinPage({ params }: PageProps<"/[locale]/join">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <JoinView />;
}
