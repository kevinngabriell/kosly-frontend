"use client";

import { Badge, SimpleGrid, Tabs, VStack } from "@chakra-ui/react";
import { AlertTriangle, BedDouble, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { StatCard } from "@/components/StatCard";
import type { KosDetailDto } from "@/lib/api-types";
import { formatIdr } from "@/lib/format";
import type { JoinableRole } from "@/lib/roles";
import { ChecklistCard } from "./ChecklistCard";
import { InviteDialog } from "./InviteDialog";
import { InvitesPanel } from "./InvitesPanel";
import { PeopleList } from "./PeopleList";
import { PendingRequestsCard } from "./PendingRequestsCard";
import { RoomsTable } from "./RoomsTable";

export function OwnerDashboard({ kos, onChanged }: { kos: KosDetailDto; onChanged: () => void }) {
  const t = useTranslations("kos.owner");
  const [tab, setTab] = useState("overview");
  const [invite, setInvite] = useState<{ open: boolean; role: JoinableRole }>({ open: false, role: "caretaker" });

  const vacant = kos.totalRooms - kos.occupiedRooms;
  const openInvite = (role: JoinableRole) => setInvite({ open: true, role });

  return (
    <>
      <Tabs.Root value={tab} onValueChange={(details) => setTab(details.value)} colorPalette="primary" lazyMount>
        <Tabs.List overflowX="auto">
          <Tabs.Trigger value="overview" minH="12">
            {t("tabs.overview")}
            {kos.pendingRequestCount > 0 && (
              <Badge colorPalette="primary" variant="solid" borderRadius="full" ml={2} aria-label={t("tabs.pending", { count: kos.pendingRequestCount })}>
                {kos.pendingRequestCount}
              </Badge>
            )}
          </Tabs.Trigger>
          <Tabs.Trigger value="rooms" minH="12">
            {t("tabs.rooms")}
          </Tabs.Trigger>
          <Tabs.Trigger value="people" minH="12">
            {t("tabs.people")}
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="overview" pt={6}>
          <VStack align="stretch" gap={6}>
            <SimpleGrid columns={{ base: 1, sm: 3 }} gap={4}>
              <StatCard label={t("stats.occupancy")} value={`${kos.occupiedRooms}/${kos.totalRooms}`} hint={t("stats.vacant", { count: vacant })} icon={<BedDouble size={20} />} colorPalette="primary" />
              <StatCard label={t("stats.collected")} value={formatIdr(kos.collectedRent)} hint={t("stats.expected", { amount: formatIdr(kos.expectedRent) })} icon={<Wallet size={20} />} colorPalette="secondary" />
              <StatCard label={t("stats.overdue")} value={kos.overdueCount} hint={t("stats.overdueHint")} icon={<AlertTriangle size={20} />} colorPalette="critical" />
            </SimpleGrid>
            {kos.pendingRequests && (
              <PendingRequestsCard kosId={kos.id} requests={kos.pendingRequests} rooms={kos.rooms} readOnly={kos.readOnly} onChanged={onChanged} />
            )}
            {kos.checklist && <ChecklistCard kosId={kos.id} checklist={kos.checklist} readOnly={kos.readOnly} onInvite={openInvite} onChanged={onChanged} />}
          </VStack>
        </Tabs.Content>

        <Tabs.Content value="rooms" pt={6}>
          <RoomsTable rooms={kos.rooms} />
        </Tabs.Content>

        <Tabs.Content value="people" pt={6}>
          <VStack align="stretch" gap={6}>
            <InvitesPanel kos={kos} onNewInvite={() => openInvite("caretaker")} onChanged={onChanged} />
            <PeopleList title={t("caretakers")} empty={t("noCaretakers")} people={kos.caretakers} palette="accent" />
            <PeopleList title={t("residents")} empty={t("noResidents")} people={kos.residents} palette="secondary" />
          </VStack>
        </Tabs.Content>
      </Tabs.Root>

      <InviteDialog open={invite.open} onOpenChange={(open) => setInvite((previous) => ({ ...previous, open }))} kos={kos} initialRole={invite.role} onCreated={onChanged} />
    </>
  );
}
