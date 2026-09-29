"use client";

import { Box, Button, Container, HStack, Text } from "@chakra-ui/react";
import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { BrandLogo } from "@/components/BrandLogo";
import { Blob } from "@/components/Blob";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "@/lib/session";
import type { FlowShellProps } from "./FlowShell.types";

/**
 * Page chrome for the single-task screens between "just registered" and "in the app" (verify, join,
 * onboarding, invites): brand, language, and a way out. The full dashboard uses AppShell instead.
 */
export function FlowShell({ children, maxW = "lg" }: FlowShellProps) {
  const t = useTranslations("common");
  const { state, logout } = useSession();
  const router = useRouter();
  const email = state.status === "authenticated" ? state.me.user.email : null;

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <Box position="relative" overflow="hidden" minH="100vh" bg="primary.subtle">
      <Blob color="secondary.100" size="300px" top="-80px" right="-60px" opacity={0.8} rotate={10} />
      <Blob color="accent.200" size="200px" bottom="-50px" left="-50px" opacity={0.75} rotate={-12} />

      <Box as="header" position="relative" zIndex={1}>
        <Container maxW="7xl" py={3}>
          <HStack justify="space-between" gap={3}>
            <BrandLogo />
            <HStack gap={2}>
              <LocaleSwitcher tone="onColor" />
              {email && (
                <>
                  <Text fontSize="sm" color="gray.700" display={{ base: "none", md: "block" }} truncate maxW="52">
                    {email}
                  </Text>
                  <Button
                    type="button"
                    variant="outline"
                    colorPalette="primary"
                    size="sm"
                    minH="10"
                    borderRadius="full"
                    bg="white"
                    aria-label={t("logout")}
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    <Box as="span" display={{ base: "none", sm: "inline" }}>
                      {t("logout")}
                    </Box>
                  </Button>
                </>
              )}
            </HStack>
          </HStack>
        </Container>
      </Box>

      <Container maxW={maxW} position="relative" zIndex={1} pb={{ base: 12, md: 20 }} pt={{ base: 4, md: 8 }}>
        {children}
      </Container>
    </Box>
  );
}
