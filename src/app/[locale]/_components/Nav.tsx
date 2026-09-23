"use client";

import {
  Box,
  Button,
  Container,
  Drawer,
  HStack,
  IconButton,
  Portal,
  Separator,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Home, Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Nav() {
  const t = useTranslations("landing.nav");

  const links = [
    { key: "howItWorks", href: "#how-it-works", label: t("howItWorks") },
    { key: "forOwners", href: "#how-it-works", label: t("forOwners") },
    { key: "forResidents", href: "#how-it-works", label: t("forResidents") },
    { key: "forCaretakers", href: "#how-it-works", label: t("forCaretakers") },
  ];

  return (
    <Box as="header" position="sticky" top={0} zIndex={10} bg="white" boxShadow="card">
      <Container maxW="7xl" py={3}>
        <HStack justify="space-between" gap={4}>
          <HStack asChild gap={2}>
            <a href="#top">
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
            </a>
          </HStack>

          <HStack gap={1} display={{ base: "none", md: "flex" }}>
            {links.map((link) => (
              <Text
                key={link.key}
                asChild
                fontSize="sm"
                fontWeight="600"
                color="gray.700"
                px={3}
                py={2}
                borderRadius="full"
                _hover={{ color: "primary.fg", bg: "primary.subtle" }}
                transition="background 0.15s ease, color 0.15s ease"
              >
                <a href={link.href}>{link.label}</a>
              </Text>
            ))}
          </HStack>

          <HStack gap={3} display={{ base: "none", md: "flex" }}>
            <Button asChild variant="ghost" colorPalette="primary" minH="10" borderRadius="full">
              <Link href="/login">{t("login")}</Link>
            </Button>
            <Button
              asChild
              colorPalette="primary"
              minH="10"
              borderRadius="full"
              boxShadow="glow"
              _hover={{ transform: "translateY(-1px)", boxShadow: "cardHover" }}
              transition="transform 0.15s ease, box-shadow 0.15s ease"
            >
              <Link href="/register">{t("register")}</Link>
            </Button>
          </HStack>

          <HStack gap={2} display={{ base: "flex", md: "none" }}>
            <Button asChild colorPalette="primary" size="sm" minH="10" borderRadius="full">
              <Link href="/register">{t("register")}</Link>
            </Button>
            <Drawer.Root placement="end" size="xs">
              <Drawer.Trigger asChild>
                <IconButton
                  aria-label={t("openMenu")}
                  variant="ghost"
                  colorPalette="primary"
                  size="sm"
                  minH="10"
                  minW="10"
                  borderRadius="full"
                >
                  <Menu />
                </IconButton>
              </Drawer.Trigger>
              <Portal>
                <Drawer.Backdrop />
                <Drawer.Positioner>
                  <Drawer.Content>
                    <Drawer.Body>
                      <VStack align="stretch" gap={5} pt={12}>
                        {links.map((link) => (
                          <Drawer.CloseTrigger key={link.key} asChild>
                            <Text asChild fontSize="md" fontWeight="600" color="gray.800" textAlign="left">
                              <a href={link.href}>{link.label}</a>
                            </Text>
                          </Drawer.CloseTrigger>
                        ))}
                        <Separator />
                        <Button asChild variant="outline" colorPalette="primary" minH="10" borderRadius="full">
                          <Link href="/login">{t("login")}</Link>
                        </Button>
                      </VStack>
                    </Drawer.Body>
                  </Drawer.Content>
                </Drawer.Positioner>
              </Portal>
            </Drawer.Root>
          </HStack>
        </HStack>
      </Container>
    </Box>
  );
}
