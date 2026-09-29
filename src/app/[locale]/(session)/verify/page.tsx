import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { firstParam, parseInviteToken } from "@/lib/params";
import { buildNoIndexMetadata } from "@/lib/seo";
import { safeNext } from "@/lib/session";
import { VerifyView } from "./_components/VerifyView";

export async function generateMetadata({ params }: PageProps<"/[locale]/verify">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "verify.metadata" });
  return buildNoIndexMetadata({ title: t("title") });
}

export default async function VerifyPage({ params, searchParams }: PageProps<"/[locale]/verify">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const resolved = await searchParams;
  return (
    <VerifyView
      invite={parseInviteToken(resolved.invite)}
      auto={firstParam(resolved.auto) === "1"}
      next={safeNext(firstParam(resolved.next)) ?? undefined}
    />
  );
}
