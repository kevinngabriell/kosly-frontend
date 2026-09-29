"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { StatusView } from "@/components/StatusView";
import { useSession, useStageGuard } from "@/lib/session";

/** Everything under /app needs a verified, signed-in person with at least one kos. */
export function AppGate({ children }: { children: ReactNode }) {
  const t = useTranslations("app");
  const { refresh } = useSession();
  const params = useParams<{ kosId?: string }>();
  const { state, me, ready } = useStageGuard("app");

  if (state.status === "error") {
    return <StatusView fullPage kind="error" title={t("loadError.title")} body={t("loadError.body")} retryLabel={t("loadError.retry")} onRetry={() => void refresh()} />;
  }
  if (!ready || !me) return <StatusView fullPage kind="loading" title={t("loading")} />;

  return (
    <AppShell me={me} activeKosId={params.kosId}>
      {children}
    </AppShell>
  );
}
