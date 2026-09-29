import { setRequestLocale } from "next-intl/server";
import { PortfolioView } from "./_components/PortfolioView";

export default async function AppHomePage({ params }: PageProps<"/[locale]/app">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PortfolioView />;
}
