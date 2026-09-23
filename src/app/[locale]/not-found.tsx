import { getLocale, getTranslations } from "next-intl/server";
import { NotFoundView } from "@/components/NotFoundView";
import { getPathname } from "@/i18n/navigation";

export default async function NotFound() {
  const locale = await getLocale();
  const t = await getTranslations("notFound");

  return (
    <NotFoundView
      headline={t("headline")}
      body={t("body")}
      homeLabel={t("homeButton")}
      homeHref={getPathname({ href: "/", locale })}
      dashboardLabel={t("dashboardButton")}
      dashboardHref={getPathname({ href: "/dashboard", locale })}
    />
  );
}
