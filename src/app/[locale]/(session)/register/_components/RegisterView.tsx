"use client";

import { Box, Button, Container, HStack, Heading, Spinner, Text, VStack } from "@chakra-ui/react";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Blob } from "@/components/Blob";
import { BrandLogo } from "@/components/BrandLogo";
import { InviteSummary } from "@/components/InviteSummary";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { Link, useRouter } from "@/i18n/navigation";
import type { MeDto } from "@/lib/api-types";
import { withQuery } from "@/lib/params";
import { loginDestination, useSession } from "@/lib/session";
import { useInvitePreview } from "@/lib/useInvitePreview";
import { RegisterForm } from "./RegisterForm";
import { RoleSelector } from "./RoleSelector";
import { ROLE_PALETTE, type Role } from "./register.types";

export function RegisterView({ initialRole, invite }: { initialRole: Role; invite?: string }) {
  const [role, setRole] = useState<Role>(initialRole);
  const [justRegistered, setJustRegistered] = useState(false);
  const t = useTranslations("register");
  const tNav = useTranslations("landing.nav");
  const router = useRouter();
  const { state, setMe } = useSession();
  const { state: inviteState, retry } = useInvitePreview(invite);

  // Someone already signed in has no reason to register again: send them where they belong.
  useEffect(() => {
    if (state.status === "authenticated" && !justRegistered) {
      router.replace(loginDestination(state.me, { invite }));
    }
  }, [state, justRegistered, invite, router]);

  // A usable invite decides the role and hides the picker; an unusable one falls back to normal signup.
  const usableInvite = inviteState.status === "ready" && inviteState.preview.status === "active" ? inviteState.preview : null;
  const checkingInvite = inviteState.status === "loading" || inviteState.status === "error";
  const effectiveRole: Role = usableInvite ? usableInvite.role : role;
  const palette = ROLE_PALETTE[effectiveRole];

  function handleRegistered(me: MeDto) {
    setJustRegistered(true);
    setMe(me);
    // Registered through an invite: after verifying, accept it automatically (no second decision needed).
    router.replace(withQuery("/verify", { invite: usableInvite ? invite : undefined, auto: usableInvite ? "1" : undefined }));
  }

  return (
    <Box position="relative" overflow="hidden" minH="100vh" bg="primary.subtle">
      <Blob color="secondary.100" size="320px" top="-90px" right="-70px" opacity={0.85} rotate={10} />
      <Blob color="accent.200" size="220px" bottom="-60px" left="-60px" opacity={0.8} rotate={-12} />

      <Box as="header" position="relative" zIndex={1}>
        <Container maxW="7xl" py={3}>
          <HStack justify="space-between" gap={4}>
            <BrandLogo />

            <HStack gap={3}>
              <LocaleSwitcher tone="onColor" />
              <Text fontSize="sm" color="gray.700" display={{ base: "none", sm: "block" }}>
                {t("loginPrompt")}
              </Text>
              <Button asChild variant="outline" colorPalette="primary" size="sm" minH="10" borderRadius="full" bg="white">
                <Link href={withQuery("/login", { invite })}>{tNav("login")}</Link>
              </Button>
            </HStack>
          </HStack>
        </Container>
      </Box>

      <Container maxW="3xl" position="relative" zIndex={1} pb={{ base: 12, md: 20 }} pt={{ base: 4, md: 8 }}>
        <VStack gap={3} textAlign="center" mb={10}>
          <HStack bg="white" display="inline-flex" px={3} py={1.5} borderRadius="full" boxShadow="card" gap={2}>
            <Box w={2} h={2} borderRadius="full" bg={`${palette}.emphasized`} transition="background 0.2s ease" />
            <Text fontSize="xs" fontWeight="700" color="gray.700" textTransform="uppercase" letterSpacing="wide">
              {t("eyebrow")}
            </Text>
          </HStack>
          <Heading as="h1" fontFamily="heading" fontWeight="800" fontSize={{ base: "3xl", md: "4xl" }} color="gray.900">
            {t("headline")}
          </Heading>
          <Text fontSize={{ base: "md", md: "lg" }} color="gray.700" maxW="lg">
            {invite ? t("invite.subheadline") : t("subheadline")}
          </Text>
        </VStack>

        <VStack align="stretch" gap={6}>
          {invite && (
            <Box>
              {inviteState.status === "loading" && (
                <HStack gap={3} bg="white" borderRadius="2xl" boxShadow="card" p={4} role="status">
                  <Spinner size="sm" color="primary.solid" />
                  <Text color="gray.700">{t("invite.checking")}</Text>
                </HStack>
              )}
              {inviteState.status === "error" && (
                <HStack gap={3} bg="critical.subtle" borderRadius="2xl" p={4} justify="space-between" role="alert">
                  <HStack gap={3}>
                    <Box color="critical.fg">
                      <AlertTriangle size={20} />
                    </Box>
                    <Text color="gray.900">{t("invite.checkFailed")}</Text>
                  </HStack>
                  <Button type="button" size="sm" minH="10" borderRadius="full" variant="outline" onClick={retry}>
                    {t("invite.retry")}
                  </Button>
                </HStack>
              )}
              {usableInvite && <InviteSummary preview={usableInvite} variant="banner" />}
              {!checkingInvite && !usableInvite && (
                <HStack gap={3} bg="accent.subtle" borderRadius="2xl" p={4} align="flex-start" role="status">
                  <Box color="accent.fg" mt={0.5}>
                    <AlertTriangle size={20} />
                  </Box>
                  <Text color="gray.900">
                    {t(
                      inviteState.status === "ready"
                        ? `invite.unusable.${inviteState.preview.status}`
                        : "invite.unusable.unknown",
                    )}
                  </Text>
                </HStack>
              )}
            </Box>
          )}

          {!usableInvite && !checkingInvite && (
            <Box>
              <Text fontSize="sm" fontWeight="700" color="gray.800" mb={3}>
                {t("roleLabel")}
              </Text>
              <RoleSelector role={role} onChange={setRole} ariaLabel={t("roleLabel")} />
            </Box>
          )}

          <Box bg="white" borderRadius="2xl" boxShadow="card" p={{ base: 6, md: 8 }}>
            <RegisterForm
              role={effectiveRole}
              inviteToken={usableInvite ? invite : undefined}
              disabled={checkingInvite}
              onRegistered={handleRegistered}
            />
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
