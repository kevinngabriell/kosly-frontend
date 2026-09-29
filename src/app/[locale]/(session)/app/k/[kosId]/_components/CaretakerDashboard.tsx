"use client";

import { SimpleGrid, Text, VStack } from "@chakra-ui/react";
import { AlertTriangle, BedDouble } from "lucide-react";
import { useTranslations } from "next-intl";
import { StatCard } from "@/components/StatCard";
import type { KosDetailDto } from "@/lib/api-types";
import { PeopleList } from "./PeopleList";
import { RoomsTable } from "./RoomsTable";

export function CaretakerDashboard({ kos }: { kos: KosDetailDto }) {
  const t = useTranslations("kos.caretaker");
  const vacant = kos.totalRooms - kos.occupiedRooms;

  return (
    <VStack align="stretch" gap={6}>
      <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
        <StatCard label={t("occupancy")} value={`${kos.occupiedRooms}/${kos.totalRooms}`} hint={t("vacant", { count: vacant })} icon={<BedDouble size={20} />} colorPalette="accent" />
        <StatCard label={t("overdue")} value={kos.overdueCount} hint={t("overdueHint")} icon={<AlertTriangle size={20} />} colorPalette="critical" />
      </SimpleGrid>
      <Text fontFamily="heading" fontWeight="700" fontSize="xl" color="gray.900">
        {t("roomsTitle")}
      </Text>
      <RoomsTable rooms={kos.rooms} />
      <PeopleList title={t("residents")} empty={t("noResidents")} people={kos.residents} palette="secondary" />
    </VStack>
  );
}
