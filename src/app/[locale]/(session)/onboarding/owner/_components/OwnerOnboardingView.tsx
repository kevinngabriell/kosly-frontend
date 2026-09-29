"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { FlowShell } from "@/components/FlowShell";
import { OwnerSetupWizard } from "@/components/OwnerSetupWizard";
import { StatusView } from "@/components/StatusView";
import { useSession, useStageGuard } from "@/lib/session";

export function OwnerOnboardingView() {
  const t = useTranslations("ownerSetup");
  const { refresh } = useSession();
  // Once the kos exists the person has a membership and no longer belongs on this route, but the wizard
  // still has its success screen to show, so hold the redirect guard until they leave on their own.
  const [created, setCreated] = useState(false);
  const { state, me, ready } = useStageGuard("onboarding-owner", { paused: created });

  if (state.status === "error") {
    return (
      <FlowShell>
        <StatusView kind="error" title={t("loadError.title")} body={t("loadError.body")} retryLabel={t("loadError.retry")} onRetry={() => void refresh()} />
      </FlowShell>
    );
  }
  if (!ready || !me) {
    return (
      <FlowShell>
        <StatusView kind="loading" title={t("loading")} />
      </FlowShell>
    );
  }

  return (
    <FlowShell maxW="2xl">
      <OwnerSetupWizard mode="first" me={me} onCreated={() => setCreated(true)} />
    </FlowShell>
  );
}
