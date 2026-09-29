import { setRequestLocale } from "next-intl/server";
import { NewKosView } from "../../_components/NewKosView";

export default async function NewKosPage({ params }: PageProps<"/[locale]/app/kos/new">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <NewKosView />;
}
