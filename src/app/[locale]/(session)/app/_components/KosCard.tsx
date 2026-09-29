"use client";

import { Badge, Box, HStack, Progress, Text, VStack } from "@chakra-ui/react";
import { Building2, Lock, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { KosSummaryDto } from "@/lib/api-types";
import { formatIdr } from "@/lib/format";
import { ROLE_PALETTE } from "@/lib/roles";

export function KosCard({ kos }: { kos: KosSummaryDto }) {
  const t = useTranslations("app.kosCard");
  const tRole = useTranslations("common.roles");
  const palette = ROLE_PALETTE[kos.role];
  const showStats = kos.role !== "tenant";
  const collectedPercent = kos.expectedRent > 0 ? Math.round((kos.collectedRent / kos.expectedRent) * 100) : 0;

  return (
    <Box
      asChild
      bg="white"
      borderRadius="2xl"
      boxShadow="card"
      borderTopWidth="6px"
      borderTopColor={`${palette}.emphasized`}
      p={5}
      transition="transform 0.15s ease, box-shadow 0.15s ease"
      _hover={{ transform: "translateY(-2px)", boxShadow: "cardHover" }}
    >
      <Link href={`/app/k/${kos.id}`}>
        <VStack align="stretch" gap={4}>
          <HStack gap={3} align="flex-start" justify="space-between">
            <HStack gap={3} minW={0} align="flex-start">
              <Box w={10} h={10} borderRadius="xl" bg={`${palette}.subtle`} color={`${palette}.fg`} display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                <Building2 size={20} />
              </Box>
              <Box minW={0}>
                <Text fontFamily="heading" fontWeight="800" fontSize="lg" color="gray.900" truncate>
                  {kos.name}
                </Text>
                <HStack gap={1} color="gray.600" fontSize="sm">
                  <MapPin size={13} aria-hidden="true" />
                  <Text truncate>{kos.city}</Text>
                </HStack>
              </Box>
            </HStack>
            <Badge colorPalette={palette} borderRadius="full" px={2.5} flexShrink={0}>
              {tRole(kos.role)}
            </Badge>
          </HStack>

          {kos.role !== "owner" && (
            <Text fontSize="sm" color="gray.700">
              {t("ownedBy", { name: kos.ownerName })}
            </Text>
          )}

          {showStats && (
            <VStack align="stretch" gap={2}>
              <HStack justify="space-between" fontSize="sm" color="gray.700">
                <Text>{t("rooms", { occupied: kos.occupiedRooms, total: kos.totalRooms })}</Text>
                <Text style={{ fontVariantNumeric: "tabular-nums" }}>{t("collected", { percent: collectedPercent })}</Text>
              </HStack>
              <Progress.Root value={collectedPercent} size="sm" colorPalette={palette} aria-label={t("collectedLabel")}>
                <Progress.Track borderRadius="full">
                  <Progress.Range />
                </Progress.Track>
              </Progress.Root>
              <Text fontSize="xs" color="gray.600" style={{ fontVariantNumeric: "tabular-nums" }}>
                {t("amounts", { collected: formatIdr(kos.collectedRent), expected: formatIdr(kos.expectedRent) })}
              </Text>
            </VStack>
          )}

          <HStack gap={2} flexWrap="wrap">
            {kos.overdueCount > 0 && (
              <Badge colorPalette="critical" borderRadius="full" px={2.5}>
                {t("overdue", { count: kos.overdueCount })}
              </Badge>
            )}
            {kos.pendingRequestCount > 0 && (
              <Badge colorPalette="primary" variant="solid" borderRadius="full" px={2.5}>
                {t("requests", { count: kos.pendingRequestCount })}
              </Badge>
            )}
            {kos.readOnly && (
              <Badge colorPalette="gray" borderRadius="full" px={2.5} gap={1}>
                <Lock size={12} aria-hidden="true" />
                {t("readOnly")}
              </Badge>
            )}
          </HStack>
        </VStack>
      </Link>
    </Box>
  );
}
