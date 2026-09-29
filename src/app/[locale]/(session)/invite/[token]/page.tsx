import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { firstParam, parseInviteToken } from "@/lib/params";
import { buildNoIndexMetadata } from "@/lib/seo";
import { InviteView } from "./_components/InviteView";

export async function generateMetadata({ params }: PageProps<"/[locale]/invite/[token]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "invite.metadata" });
  return buildNoIndexMetadata({ title: t("title") });
}

export default async function InvitePage({ params, searchParams }: PageProps<"/[locale]/invite/[token]">) {
  const { locale, token: rawToken } = await params;
  setRequestLocale(locale);

  // A token that isn't even the right shape can't be a real invite: don't send it to the API.
  const token = parseInviteToken(rawToken);
  if (!token) notFound();

  const resolved = await searchParams;
  return <InviteView token={token} auto={firstParam(resolved.auto) === "1"} />;
}
