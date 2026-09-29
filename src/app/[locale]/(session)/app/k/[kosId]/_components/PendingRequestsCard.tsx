"use client";

import { Badge, Box, Button, Heading, HStack, NativeSelect, Text, VStack } from "@chakra-ui/react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { ApiError, apiJson } from "@/lib/api-client";
import type { PendingRequestDto, RoomDto } from "@/lib/api-types";
import { ROLE_PALETTE } from "@/lib/roles";
import { useApiErrorMessage } from "@/lib/useApiErrorMessage";

/** People who asked to join with the kos code and are waiting for the owner. Only the owner decides. */
export function PendingRequestsCard({
  kosId,
  requests,
  rooms,
  readOnly,
  onChanged,
}: {
  kosId: string;
  requests: PendingRequestDto[];
  rooms: RoomDto[];
  readOnly: boolean;
  onChanged: () => void;
}) {
  const t = useTranslations("kos.requests");
  const tRole = useTranslations("common.roles");
  const format = useFormatter();
  const errorMessage = useApiErrorMessage();

  const vacant = rooms.filter((room) => room.status === "vacant");
  const [choosing, setChoosing] = useState<string | null>(null);
  const [roomId, setRoomId] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (requests.length === 0) return null;

  async function decide(request: PendingRequestDto, action: "approve" | "reject", room?: string) {
    setBusyId(request.id);
    setErrors((previous) => ({ ...previous, [request.id]: "" }));
    try {
      await apiJson<void>(`/api/v1/kos/${encodeURIComponent(kosId)}/join-requests/${encodeURIComponent(request.id)}/${action}`, {
        method: "POST",
        body: room ? { roomId: room } : {},
      });
      setChoosing(null);
      setRoomId("");
      onChanged();
    } catch (error) {
      const message = error instanceof ApiError && error.code === "room_taken" ? t("roomTaken") : errorMessage(error);
      setErrors((previous) => ({ ...previous, [request.id]: message }));
      // The room was taken or the request already decided: refresh so the list matches reality.
      if (error instanceof ApiError && (error.code === "room_taken" || error.code === "request_already_decided")) onChanged();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Box bg="white" borderRadius="2xl" boxShadow="card" p={5} borderTopWidth="6px" borderTopColor="primary.emphasized">
      <HStack gap={2} mb={1}>
        <Heading as="h2" fontFamily="heading" fontWeight="700" fontSize="lg" color="gray.900">
          {t("title")}
        </Heading>
        <Badge colorPalette="primary" variant="solid" borderRadius="full">
          {requests.length}
        </Badge>
      </HStack>
      <Text fontSize="sm" color="gray.700" mb={4}>
        {t("subtitle")}
      </Text>
      <VStack align="stretch" gap={3} role="list">
        {requests.map((request) => {
          const isTenant = request.role === "tenant";
          const busy = busyId === request.id;
          const selecting = choosing === request.id;
          return (
            <Box key={request.id} bg="gray.50" borderRadius="xl" p={4} role="listitem">
              <HStack justify="space-between" align="flex-start" gap={3} flexWrap="wrap">
                <Box minW={0}>
                  <HStack gap={2} flexWrap="wrap">
                    <Text fontWeight="700" color="gray.900">
                      {request.fullName}
                    </Text>
                    <Badge colorPalette={ROLE_PALETTE[request.role]} borderRadius="full" px={2.5}>
                      {tRole(request.role)}
                    </Badge>
                  </HStack>
                  <Text fontSize="sm" color="gray.700" wordBreak="break-all">
                    {request.email}
                  </Text>
                  <Text fontSize="xs" color="gray.600">
                    {format.dateTime(new Date(request.createdAt), { dateStyle: "medium", timeStyle: "short" })}
                  </Text>
                </Box>
                <HStack gap={2}>
                  <Button type="button" size="sm" minH="10" borderRadius="full" variant="outline" disabled={busy || readOnly} onClick={() => void decide(request, "reject")}>
                    {t("decline")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    minH="10"
                    borderRadius="full"
                    colorPalette="primary"
                    loading={busy && !selecting}
                    disabled={busy || readOnly}
                    onClick={() => (isTenant ? setChoosing(selecting ? null : request.id) : void decide(request, "approve"))}
                  >
                    {t("approve")}
                  </Button>
                </HStack>
              </HStack>

              {isTenant && selecting && (
                <VStack align="stretch" gap={2} mt={3}>
                  {vacant.length === 0 ? (
                    <Text fontSize="sm" color="critical.fg" role="alert">
                      {t("noVacantRooms")}
                    </Text>
                  ) : (
                    <>
                      <Text fontSize="sm" fontWeight="600" color="gray.800">
                        {t("chooseRoom")}
                      </Text>
                      <HStack gap={2}>
                        <NativeSelect.Root size="md" flex="1">
                          <NativeSelect.Field aria-label={t("chooseRoom")} value={roomId} onChange={(e) => setRoomId(e.target.value)} borderRadius="xl">
                            <option value="">{t("selectRoom")}</option>
                            {vacant.map((room) => (
                              <option key={room.id} value={room.id}>
                                {room.name}
                              </option>
                            ))}
                          </NativeSelect.Field>
                          <NativeSelect.Indicator />
                        </NativeSelect.Root>
                        <Button type="button" minH="10" borderRadius="full" colorPalette="primary" disabled={!roomId || busy} loading={busy} onClick={() => void decide(request, "approve", roomId)}>
                          {t("confirm")}
                        </Button>
                      </HStack>
                    </>
                  )}
                </VStack>
              )}

              {errors[request.id] && (
                <Text mt={2} fontSize="sm" color="critical.fg" fontWeight="600" role="alert">
                  {errors[request.id]}
                </Text>
              )}
            </Box>
          );
        })}
      </VStack>
    </Box>
  );
}
