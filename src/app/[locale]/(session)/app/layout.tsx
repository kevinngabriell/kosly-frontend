import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildNoIndexMetadata } from "@/lib/seo";
import { AppGate } from "./_components/AppGate";

export async function generateMetadata({ params }: LayoutProps<"/[locale]/app">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app.metadata" });
  // robots is set once here and inherited by every page below; pages only add their own title.
  return buildNoIndexMetadata({ title: t("title") });
}

export default async function AppLayout({ children, params }: LayoutProps<"/[locale]/app">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AppGate>{children}</AppGate>;
}
