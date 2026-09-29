"use client";

import { Button, VStack } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { StatusView } from "@/components/StatusView";
import { Link, useRouter } from "@/i18n/navigation";
import type { KosDetailDto } from "@/lib/api-types";
import { useMe, useSession } from "@/lib/session";
import { useApiResource } from "@/lib/useApiResource";
import { CaretakerDashboard } from "./CaretakerDashboard";
import { KosHeader } from "./KosHeader";
import { OwnerDashboard } from "./OwnerDashboard";
import { ResidentDashboard } from "./ResidentDashboard";

export function KosView({ kosId }: { kosId: string }) {
  const t = useTranslations("kos");
  const me = useMe();
  const router = useRouter();
  const { refresh } = useSession();

  const membership = me.memberships.find((m) => m.kos.id === kosId) ?? null;
  const needsOnboarding = !!membership && !membership.onboardingComplete;
  const detail = useApiResource<KosDetailDto>(membership && !needsOnboarding ? `/api/v1/kos/${encodeURIComponent(kosId)}` : null);

  // Setup for this kos isn't finished yet: it comes first.
  useEffect(() => {
    if (needsOnboarding) router.replace(`/onboarding/guest/${kosId}`);
  }, [needsOnboarding, kosId, router]);

  // Something the dashboard did (approve, invite, ...) can change numbers shown in the nav too.
  function changed() {
    detail.reload();
    void refresh();
  }

  if (!membership) {
    // Not a kos this person belongs to, or one that doesn't exist: deliberately indistinguishable.
    return (
      <StatusView
        kind="notFound"
        title={t("notFound.title")}
        body={t("notFound.body")}
        action={
          <Button asChild variant="outline" colorPalette="primary" borderRadius="full" minH="10">
            <Link href="/app">{t("notFound.back")}</Link>
          </Button>
        }
      />
    );
  }
  if (needsOnboarding || detail.status === "loading") return <StatusView kind="loading" title={t("loading")} />;
  if (detail.status === "notFound") {
    return <StatusView kind="notFound" title={t("notFound.title")} body={t("notFound.body")} action={<Button asChild variant="outline" borderRadius="full" minH="10"><Link href="/app">{t("notFound.back")}</Link></Button>} />;
  }
  if (detail.status === "error") {
    return <StatusView kind="error" title={t("error.title")} body={t("error.body")} retryLabel={t("error.retry")} onRetry={detail.reload} />;
  }

  const kos = detail.data;
  return (
    <VStack align="stretch" gap={8}>
      <KosHeader kos={kos} />
      {kos.role === "owner" && <OwnerDashboard kos={kos} onChanged={changed} />}
      {kos.role === "caretaker" && <CaretakerDashboard kos={kos} />}
      {kos.role === "tenant" && <ResidentDashboard kos={kos} />}
    </VStack>
  );
}
