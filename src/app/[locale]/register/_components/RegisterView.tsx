"use client";

import { Box, Button, Container, HStack, Heading, Text, VStack } from "@chakra-ui/react";
import { Home } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Blob } from "@/components/Blob";
import { Link } from "@/i18n/navigation";
import { RegisterForm } from "./RegisterForm";
import { RoleSelector } from "./RoleSelector";
import { ROLE_PALETTE, type Role } from "./register.types";

export function RegisterView({ initialRole }: { initialRole: Role }) {
  const [role, setRole] = useState<Role>(initialRole);
  const t = useTranslations("register");
  const tNav = useTranslations("landing.nav");
  const palette = ROLE_PALETTE[role];

  return (
    <Box position="relative" overflow="hidden" minH="100vh" bg="primary.subtle">
      <Blob color="secondary.100" size="320px" top="-90px" right="-70px" opacity={0.85} rotate={10} />
      <Blob color="accent.200" size="220px" bottom="-60px" left="-60px" opacity={0.8} rotate={-12} />

      <Box as="header" position="relative" zIndex={1}>
        <Container maxW="7xl" py={3}>
          <HStack justify="space-between" gap={4}>
            <HStack asChild gap={2}>
              <Link href="/">
                <Box
                  w={9}
                  h={9}
                  borderRadius="xl"
                  bg="primary.emphasized"
                  color="white"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  <Home size={18} strokeWidth={2.5} />
                </Box>
                <Text fontFamily="heading" fontWeight="800" fontSize="xl" color="primary.fg">
                  Kosly
                </Text>
              </Link>
            </HStack>

            <HStack gap={3}>
              <Text fontSize="sm" color="gray.700" display={{ base: "none", sm: "block" }}>
                {t("loginPrompt")}
              </Text>
              <Button asChild variant="outline" colorPalette="primary" size="sm" minH="10" borderRadius="full" bg="white">
                <Link href="/login">{tNav("login")}</Link>
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
            {t("subheadline")}
          </Text>
        </VStack>

        <VStack align="stretch" gap={6}>
          <Box>
            <Text fontSize="sm" fontWeight="700" color="gray.800" mb={3}>
              {t("roleLabel")}
            </Text>
            <RoleSelector role={role} onChange={setRole} ariaLabel={t("roleLabel")} />
          </Box>

          <Box bg="white" borderRadius="2xl" boxShadow="card" p={{ base: 6, md: 8 }}>
            <RegisterForm role={role} />
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
