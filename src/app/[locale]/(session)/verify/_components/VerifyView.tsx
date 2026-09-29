"use client";

import { Box, Button, Field, Heading, HStack, Input, Text, VStack } from "@chakra-ui/react";
import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { type FormEvent, useEffect, useState } from "react";
import { FlowShell } from "@/components/FlowShell";
import { OtpInput } from "@/components/OtpInput";
import { StatusView } from "@/components/StatusView";
import { useRouter } from "@/i18n/navigation";
import { ApiError, apiJson } from "@/lib/api-client";
import type { MeDto, VerificationChannel } from "@/lib/api-types";
import { withQuery } from "@/lib/params";
import { postAuthDestination, useSession, useStageGuard } from "@/lib/session";
import { useApiErrorMessage } from "@/lib/useApiErrorMessage";
import { ChannelPicker } from "./ChannelPicker";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\s-]{8,15}$/;

type View = "auto" | "choose" | "changeEmail";

/** Seconds until `iso`, never negative. */
function secondsUntil(iso: string, now: number): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - now) / 1000));
}

export function VerifyView({ invite, auto, next }: { invite?: string; auto: boolean; next?: string }) {
  const t = useTranslations("verify");
  const router = useRouter();
  const { setMe, refresh } = useSession();
  const errorMessage = useApiErrorMessage();

  const [finishing, setFinishing] = useState(false);
  const { state, me, ready } = useStageGuard("verify", { paused: finishing });

  const [view, setView] = useState<View>("auto");
  const [channel, setChannel] = useState<VerificationChannel>("email");
  const [phone, setPhone] = useState("");
  const [phoneEdited, setPhoneEdited] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "error" | "info"; text: string } | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const pending = me?.user.verification ?? null;
  const step: "choose" | "code" | "changeEmail" = view === "changeEmail" ? "changeEmail" : pending && view === "auto" ? "code" : "choose";
  const resendIn = pending ? secondsUntil(pending.resendAvailableAt, now) : 0;

  // Tick once a second while a resend countdown is running.
  useEffect(() => {
    if (resendIn <= 0) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [resendIn]);

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

  const user = me.user;
  // WhatsApp needs a number. Prefill from the account until the person edits the field themselves.
  const phoneValue = phoneEdited ? phone : (user.phone ?? "");
  const destination = pending?.channel === "whatsapp" ? user.phone : user.email;

  function finish(verifiedMe: MeDto) {
    setFinishing(true);
    setMe(verifiedMe);
    if (invite) {
      router.replace(withQuery(`/invite/${invite}`, { auto: auto ? "1" : undefined }));
    } else {
      router.replace(postAuthDestination(verifiedMe, next));
    }
  }

  async function sendCode(event?: FormEvent) {
    event?.preventDefault();
    setMessage(null);
    setFieldError(null);
    if (channel === "whatsapp") {
      if (!phoneValue.trim()) return setFieldError(t("errors.phoneRequired"));
      if (!PHONE_PATTERN.test(phoneValue.trim())) return setFieldError(t("errors.phoneInvalid"));
    }
    setBusy(true);
    try {
      const updated = await apiJson<MeDto>("/api/v1/auth/verification/send", {
        body: { channel, phone: channel === "whatsapp" ? phoneValue.trim() : undefined },
      });
      setMe(updated);
      setNow(Date.now());
      setCode("");
      setView("auto");
    } catch (error) {
      if (error instanceof ApiError && error.code === "validation_failed" && error.body?.fields?.phone) {
        setFieldError(t(error.body.fields.phone === "required" ? "errors.phoneRequired" : "errors.phoneInvalid"));
      } else {
        setMessage({ tone: "error", text: errorMessage(error) });
      }
    } finally {
      setBusy(false);
    }
  }

  async function confirm(digits: string) {
    if (busy || digits.length !== 6) return;
    setMessage(null);
    setBusy(true);
    try {
      finish(await apiJson<MeDto>("/api/v1/auth/verification/confirm", { body: { code: digits } }));
    } catch (error) {
      setCode("");
      setMessage({ tone: "error", text: errorMessage(error) });
      // Expired or missing codes are cleared server-side; re-read so the screen falls back to "choose".
      if (error instanceof ApiError && (error.code === "verification_expired" || error.code === "verification_not_sent")) {
        await refresh();
      }
      setBusy(false);
    }
  }

  async function changeEmail(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setFieldError(null);
    const email = newEmail.trim();
    if (!email) return setFieldError(t("errors.emailRequired"));
    if (!EMAIL_PATTERN.test(email)) return setFieldError(t("errors.emailInvalid"));
    setBusy(true);
    try {
      setMe(await apiJson<MeDto>("/api/v1/auth/verification/change-email", { body: { email } }));
      setNewEmail("");
      setCode("");
      setView("choose");
      setMessage({ tone: "info", text: t("emailChanged", { email }) });
    } catch (error) {
      if (error instanceof ApiError && error.code === "email_taken") setFieldError(t("errors.emailTaken"));
      else setMessage({ tone: "error", text: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <FlowShell>
      <VStack gap={2} textAlign="center" mb={8}>
        <Box
          w={14}
          h={14}
          borderRadius="full"
          bg="primary.solid"
          color="white"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <ShieldCheck size={26} />
        </Box>
        <Heading as="h1" fontFamily="heading" fontWeight="800" fontSize={{ base: "3xl", md: "4xl" }} color="gray.900">
          {t("headline")}
        </Heading>
        <Text fontSize={{ base: "md", md: "lg" }} color="gray.700">
          {step === "code" ? t("codeSubheadline", { destination: destination ?? "" }) : t("subheadline")}
        </Text>
      </VStack>

      <Box bg="white" borderRadius="2xl" boxShadow="card" p={{ base: 6, md: 8 }}>
        {message && (
          <Text
            mb={5}
            fontSize="sm"
            fontWeight="600"
            color={message.tone === "error" ? "critical.fg" : "secondary.fg"}
            role={message.tone === "error" ? "alert" : "status"}
          >
            {message.text}
          </Text>
        )}

        {step === "choose" && (
          <form onSubmit={sendCode} noValidate>
            <VStack align="stretch" gap={5}>
              <ChannelPicker value={channel} onChange={setChannel} disabled={busy} />
              <Text fontSize="sm" color="gray.700">
                {channel === "email" ? t("channel.email.target", { email: user.email }) : t("channel.whatsapp.hint")}
              </Text>

              {channel === "whatsapp" && (
                <Field.Root invalid={!!fieldError} required>
                  <Field.Label>
                    {t("phoneLabel")}
                    <Field.RequiredIndicator />
                  </Field.Label>
                  <Input
                    type="tel"
                    value={phoneValue}
                    onChange={(e) => {
                      setPhoneEdited(true);
                      setPhone(e.target.value);
                      setFieldError(null);
                    }}
                    placeholder={t("phonePlaceholder")}
                    size="lg"
                    borderRadius="xl"
                    autoComplete="tel"
                  />
                  <Field.ErrorText>{fieldError}</Field.ErrorText>
                </Field.Root>
              )}

              <Button
                type="submit"
                colorPalette="primary"
                size="lg"
                minH="14"
                borderRadius="full"
                loading={busy}
                loadingText={t("sending")}
                disabled={pending !== null && resendIn > 0}
              >
                {pending !== null && resendIn > 0 ? t("sendCodeWait", { seconds: resendIn }) : t("sendCode")}
              </Button>

              {channel === "email" && (
                <Button
                  type="button"
                  variant="ghost"
                  colorPalette="primary"
                  minH="10"
                  onClick={() => {
                    setMessage(null);
                    setFieldError(null);
                    setView("changeEmail");
                  }}
                >
                  {t("wrongEmail")}
                </Button>
              )}
            </VStack>
          </form>
        )}

        {step === "code" && (
          <VStack align="stretch" gap={5}>
            <OtpInput
              value={code}
              onChange={setCode}
              onComplete={(digits) => void confirm(digits)}
              invalid={message?.tone === "error"}
              disabled={busy}
              autoFocus
              aria-label={t("codeLabel")}
            />
            <Button
              type="button"
              colorPalette="primary"
              size="lg"
              minH="14"
              borderRadius="full"
              loading={busy}
              loadingText={t("verifying")}
              disabled={code.length !== 6}
              onClick={() => void confirm(code)}
            >
              {t("verifyButton")}
            </Button>

            <HStack justify="center" gap={2} flexWrap="wrap">
              <Text fontSize="sm" color="gray.700">
                {t("noCode")}
              </Text>
              <Button
                type="button"
                variant="ghost"
                colorPalette="primary"
                size="sm"
                minH="10"
                disabled={busy || resendIn > 0}
                onClick={() => void sendCode()}
              >
                {resendIn > 0 ? t("resendWait", { seconds: resendIn }) : t("resend")}
              </Button>
            </HStack>
            <Button
              type="button"
              variant="ghost"
              minH="10"
              onClick={() => {
                setMessage(null);
                setCode("");
                setView("choose");
              }}
            >
              {t("differentMethod")}
            </Button>
          </VStack>
        )}

        {step === "changeEmail" && (
          <form onSubmit={changeEmail} noValidate>
            <VStack align="stretch" gap={5}>
              <Text color="gray.700">{t("changeEmailIntro", { email: user.email })}</Text>
              <Field.Root invalid={!!fieldError} required>
                <Field.Label>
                  {t("newEmailLabel")}
                  <Field.RequiredIndicator />
                </Field.Label>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    setFieldError(null);
                  }}
                  placeholder={t("newEmailPlaceholder")}
                  size="lg"
                  borderRadius="xl"
                  autoComplete="email"
                />
                <Field.ErrorText>{fieldError}</Field.ErrorText>
              </Field.Root>
              <Button type="submit" colorPalette="primary" size="lg" minH="14" borderRadius="full" loading={busy}>
                {t("saveEmail")}
              </Button>
              <Button type="button" variant="ghost" minH="10" onClick={() => setView("choose")}>
                {t("cancel")}
              </Button>
            </VStack>
          </form>
        )}
      </Box>
    </FlowShell>
  );
}
