"use client";

import { Badge, Box, Button, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import { Lock, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { KosDetailDto } from "@/lib/api-types";
import { ROLE_PALETTE } from "@/lib/roles";

export function KosHeader({ kos }: { kos: KosDetailDto }) {
  const t = useTranslations("kos.header");
  const tRole = useTranslations("common.roles");
  const palette = ROLE_PALETTE[kos.role];

  return (
    <VStack align="stretch" gap={4}>
      <Box>
        <HStack gap={3} flexWrap="wrap">
          <Heading as="h1" fontFamily="heading" fontWeight="800" fontSize={{ base: "3xl", md: "4xl" }} color="gray.900">
            {kos.name}
          </Heading>
          <Badge colorPalette={palette} borderRadius="full" px={3} py={1}>
            {tRole(kos.role)}
          </Badge>
        </HStack>
        <HStack gap={1.5} color="gray.700" mt={1}>
          <MapPin size={16} aria-hidden="true" />
          <Text>{t("address", { address: kos.address, city: kos.city })}</Text>
        </HStack>
        {kos.role !== "owner" && (
          <Text fontSize="sm" color="gray.600" mt={1}>
            {t("ownedBy", { name: kos.ownerName })}
          </Text>
        )}
      </Box>

      {kos.readOnly && (
        <HStack gap={3} bg="gray.100" borderRadius="2xl" p={4} align="flex-start" justify="space-between" flexWrap="wrap" role="status">
          <HStack gap={3} align="flex-start" flex="1" minW="60">
            <Box color="gray.700" mt={0.5}>
              <Lock size={20} />
            </Box>
            <Box>
              <Text fontWeight="700" color="gray.900">
                {t("readOnly.title")}
              </Text>
              <Text fontSize="sm" color="gray.700">
                {kos.role === "owner" ? t("readOnly.ownerBody") : t("readOnly.otherBody", { name: kos.ownerName })}
              </Text>
            </Box>
          </HStack>
          {kos.role === "owner" && (
            <Button asChild colorPalette="primary" borderRadius="full" minH="10" size="sm">
              <Link href="/app/upgrade">{t("readOnly.cta")}</Link>
            </Button>
          )}
        </HStack>
      )}
    </VStack>
  );
}
