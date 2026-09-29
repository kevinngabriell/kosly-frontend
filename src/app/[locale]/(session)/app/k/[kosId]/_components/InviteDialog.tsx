"use client";

import { Box, Button, CloseButton, Dialog, Field, NativeSelect, Portal, SegmentGroup, Text, VStack } from "@chakra-ui/react";
import { MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CopyField } from "@/components/CopyField";
import { ApiError, apiJson } from "@/lib/api-client";
import type { InviteDto, KosDetailDto } from "@/lib/api-types";
import { type JoinableRole, ROLE_PALETTE } from "@/lib/roles";
import { WHATSAPP_SHARE_URL } from "@/lib/site";
import { useApiErrorMessage } from "@/lib/useApiErrorMessage";
import { useInviteUrl } from "@/lib/useInviteUrl";

function InviteForm({ kos, initialRole, onCreated }: { kos: KosDetailDto; initialRole: JoinableRole; onCreated: () => void }) {
  const t = useTranslations("kos.invite");
  const tRole = useTranslations("common.roles");
  const errorMessage = useApiErrorMessage();
  const inviteUrl = useInviteUrl();

  const [role, setRole] = useState<JoinableRole>(initialRole);
  const [roomId, setRoomId] = useState("");
  const [busy, setBusy] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<InviteDto | null>(null);

  const vacant = kos.rooms.filter((room) => room.status === "vacant");
  const palette = ROLE_PALETTE[role];

  async function create() {
    setError(null);
    if (role === "tenant" && !roomId) return setFieldError(t("errors.roomRequired"));
    setFieldError(null);
    setBusy(true);
    try {
      const invite = await apiJson<InviteDto>(`/api/v1/kos/${encodeURIComponent(kos.id)}/invites`, {
        body: role === "tenant" ? { role, roomId } : { role },
      });
      setCreated(invite);
      onCreated();
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === "validation_failed" && caught.body?.fields?.roomId) {
        setFieldError(t("errors.roomUnavailable"));
      } else {
        setError(errorMessage(caught));
      }
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    const url = inviteUrl(created.token);
    const shareText = t("shareMessage", { kos: kos.name, role: tRole(created.role), url });
    return (
      <VStack align="stretch" gap={4}>
        <Text color="gray.700">{t("createdBody", { days: 7 })}</Text>
        <CopyField label={t("linkLabel")} value={url} copyLabel={t("copy")} copiedLabel={t("copied")} />
        <Button asChild colorPalette="secondary" size="lg" minH="12" borderRadius="full">
          <a href={`${WHATSAPP_SHARE_URL}?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer">
            <MessageCircle size={18} />
            {t("shareWhatsApp")}
          </a>
        </Button>
      </VStack>
    );
  }

  return (
    <VStack align="stretch" gap={5}>
      <Box>
        <Text fontSize="sm" fontWeight="700" color="gray.800" mb={2}>
          {t("roleLabel")}
        </Text>
        <SegmentGroup.Root
          value={role}
          colorPalette={palette}
          onValueChange={(details) => {
            if (details.value) {
              setRole(details.value as JoinableRole);
              setFieldError(null);
            }
          }}
        >
          <SegmentGroup.Indicator />
          {(["caretaker", "tenant"] as const).map((value) => (
            <SegmentGroup.Item key={value} value={value} minH="10">
              <SegmentGroup.ItemText>{tRole(value)}</SegmentGroup.ItemText>
              <SegmentGroup.ItemHiddenInput />
            </SegmentGroup.Item>
          ))}
        </SegmentGroup.Root>
        <Text fontSize="sm" color="gray.600" mt={2}>
          {t(`roleHelp.${role}`)}
        </Text>
      </Box>

      {role === "tenant" && (
        <Field.Root invalid={!!fieldError} required>
          <Field.Label>
            {t("roomLabel")}
            <Field.RequiredIndicator />
          </Field.Label>
          {vacant.length === 0 ? (
            <Text fontSize="sm" color="critical.fg" role="alert">
              {t("noVacantRooms")}
            </Text>
          ) : (
            <NativeSelect.Root size="lg">
              <NativeSelect.Field value={roomId} onChange={(e) => { setRoomId(e.target.value); setFieldError(null); }} borderRadius="xl">
                <option value="">{t("selectRoom")}</option>
                {vacant.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          )}
          <Field.ErrorText>{fieldError}</Field.ErrorText>
        </Field.Root>
      )}

      {error && (
        <Text color="critical.fg" fontSize="sm" fontWeight="600" role="alert">
          {error}
        </Text>
      )}
      <Button type="button" colorPalette={palette} size="lg" minH="12" borderRadius="full" loading={busy} loadingText={t("creating")} disabled={role === "tenant" && vacant.length === 0} onClick={() => void create()}>
        {t("create")}
      </Button>
    </VStack>
  );
}

export function InviteDialog({
  open,
  onOpenChange,
  kos,
  initialRole,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kos: KosDetailDto;
  initialRole: JoinableRole;
  onCreated: () => void;
}) {
  const t = useTranslations("kos.invite");

  return (
    // unmountOnExit resets the form each time the dialog is opened.
    <Dialog.Root open={open} onOpenChange={(details) => onOpenChange(details.open)} placement="center" lazyMount unmountOnExit>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner p={4}>
          <Dialog.Content borderRadius="2xl" maxW="md">
            <Dialog.Header>
              <Dialog.Title fontFamily="heading" fontWeight="800">
                {t("title")}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body pb={6}>
              <InviteForm kos={kos} initialRole={initialRole} onCreated={onCreated} />
            </Dialog.Body>
            <Dialog.CloseTrigger asChild>
              <CloseButton aria-label={t("close")} />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
