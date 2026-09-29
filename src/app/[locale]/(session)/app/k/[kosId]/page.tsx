import { setRequestLocale } from "next-intl/server";
import { KosView } from "./_components/KosView";

export default async function KosPage({ params }: PageProps<"/[locale]/app/k/[kosId]">) {
  const { locale, kosId } = await params;
  setRequestLocale(locale);

  return <KosView kosId={kosId} />;
}
