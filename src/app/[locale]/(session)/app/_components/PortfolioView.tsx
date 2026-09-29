"use client";

import { Box, Button, Heading, HStack, SimpleGrid, Text, VStack } from "@chakra-ui/react";
import { AlertTriangle, BedDouble, Plus, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { StatCard } from "@/components/StatCard";
import { StatusView } from "@/components/StatusView";
import { Link, useRouter } from "@/i18n/navigation";
import type { KosSummaryDto } from "@/lib/api-types";
import { formatIdr } from "@/lib/format";
import { useMe } from "@/lib/session";
import { useApiResource } from "@/lib/useApiResource";
import { KosCard } from "./KosCard";

/**
 * /app. One kos: go straight to it, there's nothing to choose. Several: an overview of all of them, with
 * combined numbers for the ones the person owns.
 */
export function PortfolioView() {
  const t = useTranslations("app.portfolio");
  const me = useMe();
  const router = useRouter();
  const single = me.memberships.length === 1 ? me.memberships[0] : null;
  const portfolio = useApiResource<KosSummaryDto[]>(single ? null : "/api/v1/portfolio");

  useEffect(() => {
    if (single) router.replace(`/app/k/${single.kos.id}`);
  }, [single, router]);

  if (single || portfolio.status === "loading") return <StatusView kind="loading" title={t("loading")} />;
  if (portfolio.status !== "ready") {
    return <StatusView kind="error" title={t("error.title")} body={t("error.body")} retryLabel={t("error.retry")} onRetry={portfolio.reload} />;
  }

  const owned = portfolio.data.filter((kos) => kos.role === "owner");
  const totals = owned.reduce(
    (sum, kos) => ({
      rooms: sum.rooms + kos.totalRooms,
      occupied: sum.occupied + kos.occupiedRooms,
      expected: sum.expected + kos.expectedRent,
      collected: sum.collected + kos.collectedRent,
      overdue: sum.overdue + kos.overdueCount,
    }),
    { rooms: 0, occupied: 0, expected: 0, collected: 0, overdue: 0 },
  );
  const ownsAny = owned.length > 0;

  return (
    <VStack align="stretch" gap={8}>
      <Box>
        <Heading as="h1" fontFamily="heading" fontWeight="800" fontSize={{ base: "3xl", md: "4xl" }} color="gray.900">
          {ownsAny ? t("ownerTitle") : t("title")}
        </Heading>
        <Text color="gray.700" mt={1}>
          {ownsAny ? t("ownerSubtitle", { count: owned.length }) : t("subtitle")}
        </Text>
      </Box>

      {ownsAny && (
        <SimpleGrid columns={{ base: 1, sm: 3 }} gap={4}>
          <StatCard label={t("totals.occupancy")} value={`${totals.occupied}/${totals.rooms}`} hint={t("totals.occupancyHint", { count: owned.length })} icon={<BedDouble size={20} />} colorPalette="primary" />
          <StatCard label={t("totals.collected")} value={formatIdr(totals.collected)} hint={t("totals.collectedHint", { expected: formatIdr(totals.expected) })} icon={<Wallet size={20} />} colorPalette="secondary" />
          <StatCard label={t("totals.overdue")} value={totals.overdue} hint={t("totals.overdueHint")} icon={<AlertTriangle size={20} />} colorPalette="critical" />
        </SimpleGrid>
      )}

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={5}>
        {portfolio.data.map((kos) => (
          <KosCard key={kos.id} kos={kos} />
        ))}
        {(ownsAny || me.canAddKos) && (
          <Box asChild bg="white" borderRadius="2xl" boxShadow="card" borderWidth="2px" borderStyle="dashed" borderColor="gray.300" p={5} minH="40" _hover={{ borderColor: "primary.emphasized" }}>
            <Link href="/app/kos/new">
              <VStack gap={2} justify="center" h="full" color="gray.700">
                <Plus size={24} />
                <Text fontWeight="700">{t("addKos")}</Text>
                {!me.canAddKos && (
                  <Text fontSize="xs" color="gray.600">
                    {t("addKosLimit")}
                  </Text>
                )}
              </VStack>
            </Link>
          </Box>
        )}
      </SimpleGrid>

      <HStack justify="center">
        <Button asChild variant="ghost" minH="10">
          <Link href="/join">{t("joinAnother")}</Link>
        </Button>
      </HStack>
    </VStack>
  );
}
