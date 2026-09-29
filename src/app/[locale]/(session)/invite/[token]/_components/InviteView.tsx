"use client";

import { Box, Button, Heading, Text, VStack } from "@chakra-ui/react";
import { MailCheck, MailX } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { FlowShell } from "@/components/FlowShell";
import { InviteSummary } from "@/components/InviteSummary";
import { StatusView } from "@/components/StatusView";
import { Link, useRouter } from "@/i18n/navigation";
import { ApiError, apiJson } from "@/lib/api-client";
import type { MeDto } from "@/lib/api-types";
import { withQuery } from "@/lib/params";
import { ROLE_PALETTE } from "@/lib/roles";
import { useSession } from "@/lib/session";
import { useApiErrorMessage } from "@/lib/useApiErrorMessage";
import { useInvitePreview } from "@/lib/useInvitePreview";

export function InviteView({ token, auto }: { token: string; auto: boolean }) {
  const t = useTranslations("invite");
  const router = useRouter();
  const { state, setMe, logout } = useSession();
  const { state: previewState, retry } = useInvitePreview(token);
  const errorMessage = useApiErrorMessage();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ code: string; text: string } | null>(null);
  const autoTried = useRef(false);

  const me = state.status === "authenticated" ? state.me : null;
  const preview = previewState.status === "ready" ? previewState.preview : null;
  const canAccept = !!me && me.user.verified && preview?.status === "active";

  async function accept() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await apiJson<{ kosId: string; me: MeDto }>(`/api/v1/invites/${encodeURIComponent(token)}/accept`, {
        method: "POST",
        body: {},
      });
      setMe(result.me);
      router.replace(`/onboarding/guest/${result.kosId}`);
    } catch (caught) {
      setError({ code: caught instanceof ApiError ? caught.code : "network", text: errorMessage(caught) });
      setBusy(false);
    }
  }

  // Came here straight from registering + verifying through this very invite: no second click needed.
  useEffect(() => {
    if (!auto || !canAccept || autoTried.current) return;
    autoTried.current = true;
    void accept();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- accept is stable enough for a one-shot
  }, [auto, canAccept]);

  async function switchAccount() {
    await logout();
  }

  if (previewState.status === "error") {
    return (
      <FlowShell maxW="md">
        <StatusView kind="error" title={t("loadError.title")} body={t("loadError.body")} retryLabel={t("loadError.retry")} onRetry={retry} />
      </FlowShell>
    );
  }
  if (previewState.status === "unknown") {
    return (
      <FlowShell maxW="md">
        <StatusView
          kind="notFound"
          title={t("unknown.title")}
          body={t("unknown.body")}
          action={
            <Button asChild variant="outline" colorPalette="primary" borderRadius="full" minH="10">
              <Link href="/">{t("backHome")}</Link>
            </Button>
          }
        />
      </FlowShell>
    );
  }
  if (previewState.status !== "ready") {
    return (
      <FlowShell maxW="md">
        <StatusView kind="loading" title={t("loading")} />
      </FlowShell>
    );
  }

  // The invite exists but can't be used any more.
  if (previewState.preview.status !== "active") {
    return (
      <FlowShell maxW="md">
        <VStack gap={4} textAlign="center" bg="white" borderRadius="2xl" boxShadow="card" p={{ base: 6, md: 8 }}>
          <Box w={14} h={14} borderRadius="full" bg="accent.muted" color="accent.fg" display="flex" alignItems="center" justifyContent="center">
            <MailX size={26} />
          </Box>
          <Heading as="h1" fontFamily="heading" fontWeight="800" fontSize="2xl" color="gray.900">
            {t(`unusable.${previewState.preview.status}.title`)}
          </Heading>
          <Text color="gray.700">{t(`unusable.${previewState.preview.status}.body`, { kos: previewState.preview.kosName })}</Text>
          <Button asChild colorPalette="primary" borderRadius="full" minH="12" px={8}>
            <Link href={me?.user.verified ? "/join" : "/login"}>{me?.user.verified ? t("joinWithCode") : t("login")}</Link>
          </Button>
        </VStack>
      </FlowShell>
    );
  }

  const palette = ROLE_PALETTE[previewState.preview.role];

  return (
    <FlowShell maxW="md">
      <VStack gap={2} textAlign="center" mb={8}>
        <Box w={14} h={14} borderRadius="full" bg={`${palette}.solid`} color={`${palette}.contrast`} display="flex" alignItems="center" justifyContent="center">
          <MailCheck size={26} />
        </Box>
        <Heading as="h1" fontFamily="heading" fontWeight="800" fontSize={{ base: "3xl", md: "4xl" }} color="gray.900">
          {t("headline")}
        </Heading>
        <Text fontSize={{ base: "md", md: "lg" }} color="gray.700">
          {t("subheadline")}
        </Text>
      </VStack>

      <VStack align="stretch" gap={6} bg="white" borderRadius="2xl" boxShadow="card" p={{ base: 6, md: 8 }}>
        <InviteSummary preview={previewState.preview} />

        {state.status === "loading" && <StatusView kind="loading" />}

        {state.status === "error" && (
          <Text color="critical.fg" fontSize="sm" fontWeight="600" role="alert">
            {t("loadError.body")}
          </Text>
        )}

        {state.status === "anonymous" && (
          <VStack align="stretch" gap={3}>
            <Button asChild colorPalette={palette} size="lg" minH="14" borderRadius="full">
              <Link href={withQuery("/register", { invite: token })}>{t("createAccount")}</Link>
            </Button>
            <Button asChild variant="outline" colorPalette={palette} size="lg" minH="14" borderRadius="full">
              <Link href={withQuery("/login", { invite: token })}>{t("haveAccount")}</Link>
            </Button>
          </VStack>
        )}

        {me && !me.user.verified && (
          <VStack align="stretch" gap={3}>
            <Text color="gray.700">{t("verifyFirst")}</Text>
            <Button asChild colorPalette={palette} size="lg" minH="14" borderRadius="full">
              <Link href={withQuery("/verify", { invite: token, auto: auto ? "1" : undefined })}>{t("verifyButton")}</Link>
            </Button>
          </VStack>
        )}

        {me && me.user.verified && (
          <VStack align="stretch" gap={3}>
            {error && (
              <Text color="critical.fg" fontSize="sm" fontWeight="600" role="alert">
                {error.text}
              </Text>
            )}
            {error?.code === "already_member" ? (
              <Button asChild colorPalette={palette} size="lg" minH="14" borderRadius="full">
                <Link href="/app">{t("openApp")}</Link>
              </Button>
            ) : (
              <Button
                type="button"
                colorPalette={palette}
                size="lg"
                minH="14"
                borderRadius="full"
                loading={busy}
                loadingText={t("joining")}
                onClick={() => void accept()}
              >
                {t("accept", { kos: previewState.preview.kosName })}
              </Button>
            )}
            <Text fontSize="sm" color="gray.600" textAlign="center">
              {t("signedInAs", { name: me.user.fullName, email: me.user.email })}{" "}
              <Button
                type="button"
                variant="plain"
                size="sm"
                minH="10"
                px={1}
                color={`${palette}.fg`}
                fontWeight="600"
                textDecoration="underline"
                onClick={() => void switchAccount()}
              >
                {t("notYou")}
              </Button>
            </Text>
          </VStack>
        )}
      </VStack>
    </FlowShell>
  );
}
