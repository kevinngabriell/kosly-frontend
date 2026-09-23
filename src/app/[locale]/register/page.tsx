import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo";
import { RegisterView } from "./_components/RegisterView";
import { ROLES, type Role } from "./_components/register.types";

function resolveRole(value: string | string[] | undefined): Role {
  const candidate = Array.isArray(value) ? value[0] : value;
  return ROLES.includes(candidate as Role) ? (candidate as Role) : "owner";
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/register">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "register.metadata" });

  return buildPageMetadata({
    locale,
    href: "/register",
    title: t("title"),
    description: t("description"),
  });
}

export default async function RegisterPage({
  params,
  searchParams,
}: PageProps<"/[locale]/register">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const resolvedSearchParams = await searchParams;
  const initialRole = resolveRole(resolvedSearchParams.role);

  return <RegisterView initialRole={initialRole} />;
}
