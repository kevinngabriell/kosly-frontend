"use client";

import { Box, Table, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { UnitStatusBadge } from "@/components/UnitStatusBadge";
import type { RoomDto } from "@/lib/api-types";
import { formatIdr } from "@/lib/format";

export function RoomsTable({ rooms }: { rooms: RoomDto[] }) {
  const t = useTranslations("kos.rooms");
  const tStatus = useTranslations("common.roomStatus");

  return (
    <Box bg="white" borderRadius="2xl" boxShadow="card" overflowX="auto">
      <Table.Root size="md" interactive>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader pl={5}>{t("room")}</Table.ColumnHeader>
            <Table.ColumnHeader>{t("resident")}</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end">{t("rent")}</Table.ColumnHeader>
            <Table.ColumnHeader pr={5}>{t("status")}</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {rooms.map((room) => (
            <Table.Row key={room.id}>
              <Table.Cell pl={5} fontWeight="700" color="gray.900">
                {room.name}
              </Table.Cell>
              <Table.Cell>
                {room.residentName ?? (
                  <Text as="span" color="gray.500">
                    {t("noResident")}
                  </Text>
                )}
              </Table.Cell>
              <Table.Cell textAlign="end" style={{ fontVariantNumeric: "tabular-nums" }}>
                {formatIdr(room.monthlyRent)}
              </Table.Cell>
              <Table.Cell pr={5}>
                <UnitStatusBadge status={room.status} label={tStatus(room.status)} />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}
