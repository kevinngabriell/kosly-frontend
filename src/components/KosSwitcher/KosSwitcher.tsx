"use client";

import { Badge, Box, HStack, Menu, Portal, Text } from "@chakra-ui/react";
import { Building2, Check, ChevronDown, LayoutGrid } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { KosSwitcherProps } from "./KosSwitcher.types";

/**
 * Picks which kos you're looking at. With a single kos there is nothing to switch, so it collapses to a
 * plain label. Owners get an "All kos" overview on top; caretakers see the owner's name under each kos
 * because their kos can belong to different owners.
 */
export function KosSwitcher({ memberships, activeKosId }: KosSwitcherProps) {
  const t = useTranslations("app.switcher");
  const active = memberships.find((m) => m.kos.id === activeKosId);
  const isOwner = memberships.some((m) => m.role === "owner");
  const totalPending = memberships.reduce((sum, m) => sum + m.pendingRequestCount, 0);

  if (memberships.length < 2) {
    if (!active) return null;
    return (
      <HStack gap={2} color="gray.700" minW={0}>
        <Building2 size={16} aria-hidden="true" />
        <Text fontWeight="600" truncate maxW="48">
          {active.kos.name}
        </Text>
      </HStack>
    );
  }

  const label = active ? active.kos.name : t("allKos");

  return (
    <Menu.Root positioning={{ placement: "bottom-start" }}>
      <Menu.Trigger asChild>
        <Box
          as="button"
          aria-label={t("open")}
          display="flex"
          alignItems="center"
          gap={2}
          px={3}
          minH="10"
          borderRadius="full"
          bg="gray.100"
          color="gray.900"
          fontWeight="600"
          cursor="pointer"
          maxW={{ base: "44", sm: "64" }}
          _hover={{ bg: "gray.200" }}
        >
          {active ? <Building2 size={16} aria-hidden="true" /> : <LayoutGrid size={16} aria-hidden="true" />}
          <Text truncate>{label}</Text>
          {totalPending > 0 && (
            <Badge colorPalette="primary" variant="solid" borderRadius="full" aria-label={t("pending", { count: totalPending })}>
              {totalPending}
            </Badge>
          )}
          <ChevronDown size={16} aria-hidden="true" />
        </Box>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content minW="64" borderRadius="xl" boxShadow="cardHover">
            {isOwner && (
              <>
                <Menu.Item value="all" asChild minH="10">
                  <Link href="/app">
                    <LayoutGrid size={16} />
                    <Text flex="1">{t("allKos")}</Text>
                    {!active && <Check size={16} />}
                  </Link>
                </Menu.Item>
                <Menu.Separator />
              </>
            )}
            {memberships.map((membership) => (
              <Menu.Item key={membership.id} value={membership.kos.id} asChild minH="12">
                <Link href={`/app/k/${membership.kos.id}`}>
                  <Building2 size={16} />
                  <Box flex="1" minW={0}>
                    <Text fontWeight="600" truncate>
                      {membership.kos.name}
                    </Text>
                    <Text fontSize="xs" color="gray.600" truncate>
                      {membership.role === "owner"
                        ? membership.kos.city
                        : t("ownedBy", { name: membership.kos.ownerName })}
                    </Text>
                  </Box>
                  {membership.pendingRequestCount > 0 && (
                    <Badge colorPalette="primary" variant="solid" borderRadius="full">
                      {membership.pendingRequestCount}
                    </Badge>
                  )}
                  {membership.kos.id === activeKosId && <Check size={16} />}
                </Link>
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
