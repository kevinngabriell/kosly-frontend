"use client";

import { Box, Button, Field, Heading, HStack, Input, SegmentGroup, Text, VStack } from "@chakra-ui/react";
import { Clock, KeyRound, XCircle } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { type FormEvent, useEffect, useState } from "react";
import { FlowShell } from "@/components/FlowShell";
import { StatusView } from "@/components/StatusView";
import { Link, useRouter } from "@/i18n/navigation";
import { ApiError, apiJson } from "@/lib/api-client";
import type { MeDto } from "@/lib/api-types";
import { type JoinableRole, ROLE_PALETTE } from "@/lib/roles";
import { resolveLanding, useSession, useStageGuard } from "@/lib/session";
import { useApiErrorMessage } from "@/lib/useApiErrorMessage";

const POLL_MS = 20_000;

export function JoinView() {
  const t = useTranslations("join");
  const tRole = useTranslations("common.roles");
  const format = useFormatter();
  const router = useRouter();
  const { setMe, refresh } = useSession();
  const errorMessage = useApiErrorMessage();
  const { state, me, ready } = useStageGuard("join");

  const [code, setCode] = useState("");
  const [role, setRole] = useState<JoinableRole | null>(null);
  const [busy, setBusy] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const hasPending = !!me?.joinRequests.some((r) => r.status === "pending");
  const approved = !!me?.memberships.some((m) => !m.onboardingComplete);

  // Approved while waiting here: move on to that kos's onboarding.
  useEffect(() => {
    if (me && approved) router.replace(resolveLanding(me));
  }, [me, approved, router]);

  // While a request is waiting, check back now and then so approval shows up without a manual refresh.
  useEffect(() => {
    if (!hasPending) return;
    const interval = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(interval);
  }, [hasPending, refresh]);

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

  // Default the role from what they said they came to do; an owner has no joinable role, so start on resident.
  const chosenRole: JoinableRole = role ?? (me.user.intent === "caretaker" ? "caretaker" : "tenant");
  const palette = ROLE_PALETTE[chosenRole];
  const pending = me.joinRequests.filter((r) => r.status === "pending");
  const rejected = me.joinRequests.filter((r) => r.status === "rejected");
  const hasMemberships = me.memberships.length > 0;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    if (!code.trim()) return setFieldError(t("errors.codeRequired"));
    setFieldError(null);
    setBusy(true);
    try {
      const updated = await apiJson<MeDto>("/api/v1/join-requests", { body: { code: code.trim(), role: chosenRole } });
      setMe(updated);
      setCode("");
    } catch (error) {
      if (error instanceof ApiError && error.code === "code_not_found") setFieldError(t("errors.codeNotFound"));
      else setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function cancel(requestId: string) {
    setMessage(null);
    try {
      await apiJson<void>(`/api/v1/join-requests/${encodeURIComponent(requestId)}`, { method: "DELETE" });
      await refresh();
    } catch (error) {
      setMessage(errorMessage(error));
    }
  }

  return (
    <FlowShell>
      <VStack gap={2} textAlign="center" mb={8}>
        <Box w={14} h={14} borderRadius="full" bg={`${palette}.solid`} color={`${palette}.contrast`} display="flex" alignItems="center" justifyContent="center">
          <KeyRound size={26} />
        </Box>
        <Heading as="h1" fontFamily="heading" fontWeight="800" fontSize={{ base: "3xl", md: "4xl" }} color="gray.900">
          {t("headline")}
        </Heading>
        <Text fontSize={{ base: "md", md: "lg" }} color="gray.700">
          {t("subheadline")}
        </Text>
      </VStack>

      <VStack align="stretch" gap={5}>
        {message && (
          <Text color="critical.fg" fontSize="sm" fontWeight="600" role="alert">
            {message}
          </Text>
        )}

        {pending.map((request) => (
          <Box key={request.id} bg="white" borderRadius="2xl" boxShadow="card" p={5} borderTopWidth="6px" borderTopColor={`${ROLE_PALETTE[request.role]}.emphasized`}>
            <HStack gap={3} align="flex-start">
              <Box color={`${ROLE_PALETTE[request.role]}.fg`} mt={0.5}>
                <Clock size={22} />
              </Box>
              <Box flex="1" minW={0}>
                <Text fontWeight="700" color="gray.900">
                  {t("pending.title", { kos: request.kosName })}
                </Text>
                <Text fontSize="sm" color="gray.700">
                  {t("pending.body", { role: tRole(request.role) })}
                </Text>
                <Text fontSize="xs" color="gray.600" mt={1}>
                  {t("pending.sent", { when: format.dateTime(new Date(request.createdAt), { dateStyle: "medium", timeStyle: "short" }) })}
                </Text>
              </Box>
              <Button type="button" variant="outline" size="sm" minH="10" borderRadius="full" onClick={() => void cancel(request.id)}>
                {t("pending.cancel")}
              </Button>
            </HStack>
          </Box>
        ))}

        {rejected.map((request) => (
          <HStack key={request.id} gap={3} bg="critical.subtle" borderRadius="2xl" p={4} align="flex-start" role="status">
            <Box color="critical.fg" mt={0.5}>
              <XCircle size={20} />
            </Box>
            <Text color="gray.900">{t("rejected", { kos: request.kosName })}</Text>
          </HStack>
        ))}

        <Box bg="white" borderRadius="2xl" boxShadow="card" p={{ base: 6, md: 8 }}>
          <form onSubmit={submit} noValidate>
            <VStack align="stretch" gap={5}>
              {pending.length > 0 && (
                <Text fontWeight="700" color="gray.900">
                  {t("another")}
                </Text>
              )}
              <Field.Root invalid={!!fieldError} required>
                <Field.Label>
                  {t("codeLabel")}
                  <Field.RequiredIndicator />
                </Field.Label>
                <Input
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setFieldError(null);
                  }}
                  placeholder={t("codePlaceholder")}
                  size="lg"
                  borderRadius="xl"
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  textTransform="uppercase"
                />
                {fieldError ? <Field.ErrorText>{fieldError}</Field.ErrorText> : <Field.HelperText>{t("codeHelper")}</Field.HelperText>}
              </Field.Root>

              <Box>
                <Text fontSize="sm" fontWeight="700" color="gray.800" mb={2}>
                  {t("roleLabel")}
                </Text>
                <SegmentGroup.Root value={chosenRole} onValueChange={(details) => details.value && setRole(details.value as JoinableRole)} colorPalette={palette}>
                  <SegmentGroup.Indicator />
                  {(["tenant", "caretaker"] as const).map((value) => (
                    <SegmentGroup.Item key={value} value={value} minH="10">
                      <SegmentGroup.ItemText>{tRole(value)}</SegmentGroup.ItemText>
                      <SegmentGroup.ItemHiddenInput />
                    </SegmentGroup.Item>
                  ))}
                </SegmentGroup.Root>
              </Box>

              <Button type="submit" colorPalette={palette} size="lg" minH="14" borderRadius="full" loading={busy} loadingText={t("sending")}>
                {t("submit")}
              </Button>
            </VStack>
          </form>
        </Box>

        <Text fontSize="sm" color="gray.700" textAlign="center">
          {t("haveInvite")}
        </Text>

        <HStack justify="center" gap={4} flexWrap="wrap">
          {hasMemberships ? (
            <Button asChild variant="ghost" minH="10">
              <Link href="/app">{t("backToApp")}</Link>
            </Button>
          ) : (
            <Button asChild variant="ghost" minH="10" colorPalette="primary">
              <Link href="/onboarding/owner">{t("imAnOwner")}</Link>
            </Button>
          )}
        </HStack>
      </VStack>
    </FlowShell>
  );
}
