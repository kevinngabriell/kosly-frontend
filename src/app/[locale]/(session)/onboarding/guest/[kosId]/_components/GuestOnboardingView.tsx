"use client";

import { Box, Button, Field, Heading, HStack, Input, Text, VStack } from "@chakra-ui/react";
import { CheckCircle2, Home } from "lucide-react";
import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { FlowShell } from "@/components/FlowShell";
import { StatusView } from "@/components/StatusView";
import { useRouter } from "@/i18n/navigation";
import { ApiError, apiJson } from "@/lib/api-client";
import type { KosDetailDto, MeDto } from "@/lib/api-types";
import { formatIdr } from "@/lib/format";
import { ROLE_PALETTE } from "@/lib/roles";
import { useSession, useStageGuard } from "@/lib/session";
import { useApiErrorMessage } from "@/lib/useApiErrorMessage";
import { useApiResource } from "@/lib/useApiResource";
import { PaymentWalkthrough } from "./PaymentWalkthrough";

const PHONE_PATTERN = /^[0-9+\s-]{8,15}$/;

export function GuestOnboardingView({ kosId }: { kosId: string }) {
  const t = useTranslations("guestOnboarding");
  const tRole = useTranslations("common.roles");
  const router = useRouter();
  const { setMe, refresh } = useSession();
  const errorMessage = useApiErrorMessage();

  // After the last step the membership is complete and this route stops applying; hold the guard so the
  // "you're all set" screen can show and the person leaves by choice.
  const [finished, setFinished] = useState<{ flagged: boolean } | null>(null);
  const { state, me, ready } = useStageGuard("onboarding-guest", { kosId, paused: finished !== null });

  const membership = me?.memberships.find((m) => m.kos.id === kosId) ?? null;
  const isTenant = membership?.role === "tenant";

  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ fullName?: string; phone?: string }>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // The resident's room and rent live in the kos detail (a resident only ever receives their own room).
  const detail = useApiResource<KosDetailDto>(isTenant ? `/api/v1/kos/${encodeURIComponent(kosId)}` : null);

  if (state.status === "error") {
    return (
      <FlowShell>
        <StatusView kind="error" title={t("loadError.title")} body={t("loadError.body")} retryLabel={t("loadError.retry")} onRetry={() => void refresh()} />
      </FlowShell>
    );
  }
  if (!ready || !me || !membership) {
    return (
      <FlowShell>
        <StatusView kind="loading" title={t("loading")} />
      </FlowShell>
    );
  }

  const palette = ROLE_PALETTE[membership.role];
  const nameValue = fullName ?? me.user.fullName;
  const phoneValue = phone ?? me.user.phone ?? "";

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    const next: typeof errors = {};
    if (!nameValue.trim()) next.fullName = t("profile.errors.nameRequired");
    if (!phoneValue.trim()) next.phone = t("profile.errors.phoneRequired");
    else if (!PHONE_PATTERN.test(phoneValue.trim())) next.phone = t("profile.errors.phoneInvalid");
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    setMessage(null);
    try {
      setMe(await apiJson<MeDto>("/api/v1/me", { method: "PATCH", body: { fullName: nameValue.trim(), phone: phoneValue.trim() } }));
      setStep(2);
    } catch (error) {
      if (error instanceof ApiError && error.code === "validation_failed" && error.body?.fields) {
        const fields = error.body.fields;
        setErrors({
          fullName: fields.fullName ? t("profile.errors.nameRequired") : undefined,
          phone: fields.phone ? t("profile.errors.phoneInvalid") : undefined,
        });
      } else {
        setMessage(errorMessage(error));
      }
    } finally {
      setBusy(false);
    }
  }

  async function complete(roomConfirmed?: boolean) {
    setBusy(true);
    setMessage(null);
    try {
      const updated = await apiJson<MeDto>(`/api/v1/memberships/${encodeURIComponent(membership!.id)}/onboarding/complete`, {
        body: { roomConfirmed },
      });
      setFinished({ flagged: roomConfirmed === false });
      setMe(updated);
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  if (finished) {
    return (
      <FlowShell>
        <VStack gap={4} textAlign="center" bg="white" borderRadius="2xl" boxShadow="card" p={{ base: 6, md: 10 }}>
          <Box w={14} h={14} borderRadius="full" bg={`${palette}.solid`} color={`${palette}.contrast`} display="flex" alignItems="center" justifyContent="center">
            <CheckCircle2 size={28} />
          </Box>
          <Heading as="h1" fontFamily="heading" fontWeight="800" fontSize="2xl" color="gray.900">
            {t("done.title")}
          </Heading>
          <Text color="gray.700" maxW="md">
            {finished.flagged ? t("done.flagged", { owner: membership.kos.ownerName }) : t(`done.body.${membership.role}`, { kos: membership.kos.name })}
          </Text>
          <Button type="button" colorPalette={palette} size="lg" minH="14" borderRadius="full" px={8} onClick={() => router.replace(`/app/k/${kosId}`)}>
            {t("done.cta")}
          </Button>
        </VStack>
      </FlowShell>
    );
  }

  return (
    <FlowShell>
      <VStack gap={2} textAlign="center" mb={6}>
        <HStack gap={2} aria-hidden="true">
          {[1, 2].map((index) => (
            <Box key={index} h={1.5} w={12} borderRadius="full" bg={index <= step ? `${palette}.emphasized` : "gray.200"} />
          ))}
        </HStack>
        <Text fontSize="xs" fontWeight="700" color="gray.700" textTransform="uppercase" letterSpacing="wide">
          {t("stepOf", { step, total: 2 })}
        </Text>
        <Heading as="h1" fontFamily="heading" fontWeight="800" fontSize={{ base: "3xl", md: "4xl" }} color="gray.900">
          {t("headline", { kos: membership.kos.name })}
        </Heading>
        <Text fontSize={{ base: "md", md: "lg" }} color="gray.700">
          {t("subheadline", { role: tRole(membership.role), owner: membership.kos.ownerName })}
        </Text>
      </VStack>

      <Box bg="white" borderRadius="2xl" boxShadow="card" p={{ base: 6, md: 8 }} borderTopWidth="6px" borderTopColor={`${palette}.emphasized`}>
        {message && (
          <Text mb={5} color="critical.fg" fontSize="sm" fontWeight="600" role="alert">
            {message}
          </Text>
        )}

        {step === 1 && (
          <form onSubmit={saveProfile} noValidate>
            <VStack align="stretch" gap={5} colorPalette={palette}>
              <Text fontWeight="700" color="gray.900">
                {t("profile.title")}
              </Text>
              <Field.Root invalid={!!errors.fullName} required>
                <Field.Label>
                  {t("profile.nameLabel")}
                  <Field.RequiredIndicator />
                </Field.Label>
                <Input value={nameValue} onChange={(e) => { setFullName(e.target.value); setErrors((p) => ({ ...p, fullName: undefined })); }} size="lg" borderRadius="xl" autoComplete="name" />
                <Field.ErrorText>{errors.fullName}</Field.ErrorText>
              </Field.Root>
              <Field.Root invalid={!!errors.phone} required>
                <Field.Label>
                  {t("profile.phoneLabel")}
                  <Field.RequiredIndicator />
                </Field.Label>
                <Input type="tel" value={phoneValue} onChange={(e) => { setPhone(e.target.value); setErrors((p) => ({ ...p, phone: undefined })); }} placeholder={t("profile.phonePlaceholder")} size="lg" borderRadius="xl" autoComplete="tel" />
                {errors.phone ? <Field.ErrorText>{errors.phone}</Field.ErrorText> : <Field.HelperText>{t("profile.phoneHelper")}</Field.HelperText>}
              </Field.Root>
              <Button type="submit" colorPalette={palette} size="lg" minH="14" borderRadius="full" loading={busy} loadingText={t("saving")}>
                {t("continue")}
              </Button>
            </VStack>
          </form>
        )}

        {step === 2 && isTenant && (
          <VStack align="stretch" gap={5}>
            <Text fontWeight="700" color="gray.900">
              {t("room.title")}
            </Text>
            {detail.status === "loading" && <StatusView kind="loading" />}
            {detail.status === "error" && (
              <StatusView kind="error" title={t("loadError.title")} body={t("loadError.body")} retryLabel={t("loadError.retry")} onRetry={detail.reload} />
            )}
            {detail.status === "ready" && detail.data.myRoom && (
              <>
                <VStack align="stretch" gap={2} bg="gray.50" borderRadius="xl" p={4}>
                  <HStack gap={2}>
                    <Home size={16} aria-hidden="true" />
                    <Text fontWeight="700" color="gray.900">
                      {t("room.summary", { kos: detail.data.name, room: detail.data.myRoom.name })}
                    </Text>
                  </HStack>
                  <Text color="gray.800" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {t("room.rent", { amount: formatIdr(detail.data.myRoom.monthlyRent) })}
                  </Text>
                  <Text fontSize="sm" color="gray.700">
                    {t("room.dueDay", { day: detail.data.myRoom.dueDay })}
                  </Text>
                </VStack>
                <Text fontSize="sm" color="gray.700">
                  {t("room.question")}
                </Text>
                <Button type="button" colorPalette={palette} size="lg" minH="14" borderRadius="full" loading={busy} loadingText={t("finishing")} onClick={() => void complete(true)}>
                  {t("room.confirm")}
                </Button>
                <Button type="button" variant="outline" minH="12" borderRadius="full" disabled={busy} onClick={() => void complete(false)}>
                  {t("room.report")}
                </Button>
              </>
            )}
            {detail.status === "ready" && !detail.data.myRoom && (
              <>
                <Text color="gray.700">{t("room.none")}</Text>
                <Button type="button" colorPalette={palette} size="lg" minH="14" borderRadius="full" loading={busy} onClick={() => void complete(true)}>
                  {t("finish")}
                </Button>
              </>
            )}
          </VStack>
        )}

        {step === 2 && !isTenant && (
          <VStack align="stretch" gap={5}>
            <PaymentWalkthrough onDone={() => void complete()} />
            <Button type="button" variant="ghost" minH="10" disabled={busy} onClick={() => void complete()}>
              {t("walkthrough.skip")}
            </Button>
          </VStack>
        )}
      </Box>
    </FlowShell>
  );
}
