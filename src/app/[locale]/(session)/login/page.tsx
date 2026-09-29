import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { firstParam, parseInviteToken } from "@/lib/params";
import { buildPageMetadata } from "@/lib/seo";
import { safeNext } from "@/lib/session";
import { LoginView } from "./_components/LoginView";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/login">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "login.metadata" });

  return buildPageMetadata({
    locale,
    href: "/login",
    title: t("title"),
    description: t("description"),
  });
}

export default async function LoginPage({ params, searchParams }: PageProps<"/[locale]/login">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const resolved = await searchParams;
  return (
    <LoginView
      next={safeNext(firstParam(resolved.next)) ?? undefined}
      invite={parseInviteToken(resolved.invite)}
    />
  );
}
