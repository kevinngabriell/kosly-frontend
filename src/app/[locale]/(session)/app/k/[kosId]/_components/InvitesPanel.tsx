"use client";

import { Badge, Box, Button, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import { Ban, CheckCircle2, Clock, Link2, Plus, RefreshCw, TimerOff } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { type ReactNode, useEffect, useState } from "react";
import { CopyField } from "@/components/CopyField";
import { apiJson } from "@/lib/api-client";
import type { InviteDto, InviteStatus, KosDetailDto } from "@/lib/api-types";
import { ROLE_PALETTE } from "@/lib/roles";
import { useApiErrorMessage } from "@/lib/useApiErrorMessage";
import { useInviteUrl } from "@/lib/useInviteUrl";

const STATUS_ICON: Record<InviteStatus, ReactNode> = {
  active: <Clock size={12} aria-hidden="true" />,
  used: <CheckCircle2 size={12} aria-hidden="true" />,
  expired: <TimerOff size={12} aria-hidden="true" />,
  revoked: <Ban size={12} aria-hidden="true" />,
};
const STATUS_PALETTE: Record<InviteStatus, string> = { active: "green", used: "gray", expired: "orange", revoked: "gray" };

/** The two ways to bring people in: the kos join code (they ask, the owner approves) and personal invite links. */
export function InvitesPanel({
  kos,
  onNewInvite,
  onChanged,
}: {
  kos: KosDetailDto;
  onNewInvite: () => void;
  onChanged: () => void;
}) {
  const t = useTranslations("kos.invites");
  const tRole = useTranslations("common.roles");
  const format = useFormatter();
  const errorMessage = useApiErrorMessage();
  const inviteUrl = useInviteUrl();

  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!copiedId) return;
    const timeout = setTimeout(() => setCopiedId(null), 2000);
    return () => clearTimeout(timeout);
  }, [copiedId]);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      onChanged();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
      setConfirmRegenerate(false);
      setConfirmRevoke(null);
    }
  }

  async function copyLink(invite: InviteDto) {
    try {
      await navigator.clipboard.writeText(inviteUrl(invite.token));
      setCopiedId(invite.id);
    } catch {
      setCopiedId(null);
    }
  }

  const invites = kos.invites ?? [];

  return (
    <Box bg="white" borderRadius="2xl" boxShadow="card" p={5}>
      <Heading as="h2" fontFamily="heading" fontWeight="700" fontSize="lg" color="gray.900" mb={1}>
        {t("title")}
      </Heading>
      <Text fontSize="sm" color="gray.700" mb={4}>
        {t("subtitle")}
      </Text>

      <VStack align="stretch" gap={4}>
        {kos.joinCode && <CopyField label={t("codeLabel")} value={kos.joinCode} copyLabel={t("copy")} copiedLabel={t("copied")} />}
        <Text fontSize="sm" color="gray.600">
          {t("codeHelp")}
        </Text>
        <HStack gap={2} flexWrap="wrap">
          <Button type="button" colorPalette="primary" borderRadius="full" minH="10" disabled={kos.readOnly} onClick={onNewInvite}>
            <Plus size={16} />
            {t("newInvite")}
          </Button>
          {confirmRegenerate ? (
            <HStack gap={2} flexWrap="wrap">
              <Text fontSize="sm" color="gray.700">
                {t("regenerateWarning")}
              </Text>
              <Button type="button" size="sm" minH="10" borderRadius="full" colorPalette="critical" loading={busy} onClick={() => void run(() => apiJson(`/api/v1/kos/${encodeURIComponent(kos.id)}/join-code/regenerate`, { method: "POST", body: {} }))}>
                {t("regenerateConfirm")}
              </Button>
              <Button type="button" size="sm" minH="10" variant="ghost" onClick={() => setConfirmRegenerate(false)}>
                {t("cancel")}
              </Button>
            </HStack>
          ) : (
            <Button type="button" variant="ghost" borderRadius="full" minH="10" disabled={kos.readOnly} onClick={() => setConfirmRegenerate(true)}>
              <RefreshCw size={16} />
              {t("regenerate")}
            </Button>
          )}
        </HStack>

        {error && (
          <Text color="critical.fg" fontSize="sm" fontWeight="600" role="alert">
            {error}
          </Text>
        )}

        <Box>
          <Text fontWeight="700" color="gray.900" mb={2}>
            {t("listTitle")}
          </Text>
          {invites.length === 0 ? (
            <Text fontSize="sm" color="gray.600">
              {t("empty")}
            </Text>
          ) : (
            <VStack align="stretch" gap={2} role="list">
              {invites.map((invite) => (
                <HStack key={invite.id} gap={3} bg="gray.50" borderRadius="xl" px={4} py={3} justify="space-between" flexWrap="wrap" role="listitem">
                  <Box minW={0}>
                    <HStack gap={2} flexWrap="wrap">
                      <Badge colorPalette={ROLE_PALETTE[invite.role]} borderRadius="full" px={2.5}>
                        {tRole(invite.role)}
                      </Badge>
                      {invite.roomName && (
                        <Text fontSize="sm" color="gray.800" fontWeight="600">
                          {t("room", { name: invite.roomName })}
                        </Text>
                      )}
                      <Badge colorPalette={STATUS_PALETTE[invite.status]} borderRadius="full" px={2.5} gap={1}>
                        {STATUS_ICON[invite.status]}
                        {t(`status.${invite.status}`)}
                      </Badge>
                    </HStack>
                    <Text fontSize="xs" color="gray.600" mt={1}>
                      {invite.status === "active"
                        ? t("expiresOn", { date: format.dateTime(new Date(invite.expiresAt), { dateStyle: "medium" }) })
                        : t("createdOn", { date: format.dateTime(new Date(invite.createdAt), { dateStyle: "medium" }) })}
                    </Text>
                  </Box>
                  {invite.status === "active" && (
                    <HStack gap={2}>
                      <Button type="button" size="sm" minH="10" borderRadius="full" variant="outline" onClick={() => void copyLink(invite)}>
                        <Link2 size={14} />
                        <span aria-live="polite">{copiedId === invite.id ? t("copied") : t("copyLink")}</span>
                      </Button>
                      {confirmRevoke === invite.id ? (
                        <>
                          <Button type="button" size="sm" minH="10" borderRadius="full" colorPalette="critical" loading={busy} onClick={() => void run(() => apiJson(`/api/v1/kos/${encodeURIComponent(kos.id)}/invites/${encodeURIComponent(invite.id)}`, { method: "DELETE" }))}>
                            {t("revokeConfirm")}
                          </Button>
                          <Button type="button" size="sm" minH="10" variant="ghost" onClick={() => setConfirmRevoke(null)}>
                            {t("cancel")}
                          </Button>
                        </>
                      ) : (
                        <Button type="button" size="sm" minH="10" borderRadius="full" variant="ghost" disabled={kos.readOnly} onClick={() => setConfirmRevoke(invite.id)}>
                          {t("revoke")}
                        </Button>
                      )}
                    </HStack>
                  )}
                </HStack>
              ))}
            </VStack>
          )}
        </Box>
      </VStack>
    </Box>
  );
}
