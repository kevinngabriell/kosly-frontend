import { setRequestLocale } from "next-intl/server";
import { UpgradeView } from "../_components/UpgradeView";

export default async function UpgradePage({ params }: PageProps<"/[locale]/app/upgrade">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <UpgradeView />;
}
