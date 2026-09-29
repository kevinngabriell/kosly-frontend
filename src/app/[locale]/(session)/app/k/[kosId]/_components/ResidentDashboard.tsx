"use client";

import { Box, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import { Receipt } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { UnitStatusBadge } from "@/components/UnitStatusBadge";
import type { KosDetailDto } from "@/lib/api-types";
import { formatIdr } from "@/lib/format";
import { PeopleList } from "./PeopleList";

export function ResidentDashboard({ kos }: { kos: KosDetailDto }) {
  const t = useTranslations("kos.resident");
  const tStatus = useTranslations("common.roomStatus");
  const format = useFormatter();
  const room = kos.myRoom;

  return (
    <VStack align="stretch" gap={6}>
      {room ? (
        <Box bg="white" borderRadius="2xl" boxShadow="card" p={6} borderTopWidth="6px" borderTopColor="secondary.emphasized">
          <HStack justify="space-between" align="flex-start" gap={3} flexWrap="wrap">
            <Box>
              <Text fontSize="sm" color="gray.600">
                {t("yourRoom")}
              </Text>
              <Heading as="h2" fontFamily="heading" fontWeight="800" fontSize="3xl" color="gray.900">
                {room.name}
              </Heading>
            </Box>
            <UnitStatusBadge status={room.status} label={tStatus(room.status)} />
          </HStack>
          <Text mt={4} fontFamily="heading" fontWeight="800" fontSize="2xl" color="gray.900" style={{ fontVariantNumeric: "tabular-nums" }}>
            {t("rent", { amount: formatIdr(room.monthlyRent) })}
          </Text>
          <Text color="gray.700">{t("dueDay", { day: room.dueDay })}</Text>
          <Text mt={3} fontSize="sm" color={room.status === "overdue" ? "critical.fg" : "gray.700"} fontWeight={room.status === "overdue" ? "700" : "400"}>
            {t(`statusNote.${room.status}`)}
          </Text>
        </Box>
      ) : (
        <Box bg="white" borderRadius="2xl" boxShadow="card" p={6}>
          <Text color="gray.700">{t("noRoom")}</Text>
        </Box>
      )}

      <Box bg="white" borderRadius="2xl" boxShadow="card" p={5}>
        <Heading as="h2" fontFamily="heading" fontWeight="700" fontSize="lg" color="gray.900" mb={3}>
          {t("paymentsTitle")}
        </Heading>
        {!room || room.payments.length === 0 ? (
          <Text color="gray.600" fontSize="sm">
            {t("noPayments")}
          </Text>
        ) : (
          <VStack align="stretch" gap={2} role="list">
            {room.payments.map((payment) => (
              <HStack key={payment.id} gap={3} bg="gray.50" borderRadius="xl" px={4} py={3} justify="space-between" role="listitem">
                <HStack gap={3} minW={0}>
                  <Box color="secondary.fg" flexShrink={0}>
                    <Receipt size={20} aria-hidden="true" />
                  </Box>
                  <Box minW={0}>
                    <Text fontWeight="700" color="gray.900" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {formatIdr(payment.amount)}
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      {t("paymentMeta", {
                        date: format.dateTime(new Date(payment.paidAt), { dateStyle: "medium", timeStyle: "short" }),
                        by: payment.loggedBy,
                      })}
                    </Text>
                  </Box>
                </HStack>
              </HStack>
            ))}
          </VStack>
        )}
      </Box>

      <PeopleList title={t("caretakers")} empty={t("noCaretakers")} people={kos.caretakers} palette="accent" />
    </VStack>
  );
}
