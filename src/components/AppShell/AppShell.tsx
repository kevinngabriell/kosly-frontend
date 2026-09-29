"use client";

import { Box, Container, HStack } from "@chakra-ui/react";
import { BrandLogo } from "@/components/BrandLogo";
import { KosSwitcher } from "@/components/KosSwitcher";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { UserMenu } from "@/components/UserMenu";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "@/lib/session";
import type { AppShellProps } from "./AppShell.types";

/** Page chrome for the signed-in app: brand, kos switcher, language, and the account menu. */
export function AppShell({ me, activeKosId, children }: AppShellProps) {
  const { logout } = useSession();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <Box minH="100vh" bg="gray.50">
      <Box as="header" position="sticky" top={0} zIndex={10} bg="white" boxShadow="card">
        <Container maxW="6xl" py={3}>
          <HStack justify="space-between" gap={3}>
            <HStack gap={{ base: 2, md: 5 }} minW={0}>
              <BrandLogo href="/app" />
              <KosSwitcher memberships={me.memberships} activeKosId={activeKosId} />
            </HStack>
            <HStack gap={2}>
              <LocaleSwitcher />
              <UserMenu me={me} onLogout={handleLogout} />
            </HStack>
          </HStack>
        </Container>
      </Box>
      <Container maxW="6xl" py={{ base: 6, md: 10 }}>
        {children}
      </Container>
    </Box>
  );
}
