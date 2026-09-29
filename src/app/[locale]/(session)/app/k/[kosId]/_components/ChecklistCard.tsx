"use client";

import { Box, Button, Heading, HStack, Progress, Text, VStack } from "@chakra-ui/react";
import { CheckCircle2, Circle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { apiJson } from "@/lib/api-client";
import type { ChecklistDto } from "@/lib/api-types";
import type { JoinableRole } from "@/lib/roles";
import { useApiErrorMessage } from "@/lib/useApiErrorMessage";

/** The skippable "Getting started" list on an owner's dashboard. */
export function ChecklistCard({
  kosId,
  checklist,
  readOnly,
  onInvite,
  onChanged,
}: {
  kosId: string;
  checklist: ChecklistDto;
  readOnly: boolean;
  onInvite: (role: JoinableRole) => void;
  onChanged: () => void;
}) {
  const t = useTranslations("kos.checklist");
  const errorMessage = useApiErrorMessage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (checklist.dismissed) return null;

  const done = checklist.items.filter((item) => item.done).length;
  const total = checklist.items.length;
  const percent = Math.round((done / total) * 100);

  async function hide() {
    setBusy(true);
    setError(null);
    try {
      await apiJson<void>(`/api/v1/kos/${encodeURIComponent(kosId)}/checklist`, { method: "PATCH", body: { dismissed: true } });
      onChanged();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  const actions: Partial<Record<ChecklistDto["items"][number]["key"], JoinableRole>> = {
    inviteCaretaker: "caretaker",
    inviteResident: "tenant",
  };

  return (
    <Box bg="white" borderRadius="2xl" boxShadow="card" p={5} borderTopWidth="6px" borderTopColor="primary.emphasized">
      <HStack justify="space-between" align="flex-start" mb={3} gap={3}>
        <Box>
          <Heading as="h2" fontFamily="heading" fontWeight="700" fontSize="lg" color="gray.900">
            {t("title")}
          </Heading>
          <Text fontSize="sm" color="gray.700">
            {done === total ? t("allDone") : t("progress", { done, total })}
          </Text>
        </Box>
        <Button type="button" variant="ghost" size="sm" minH="10" loading={busy} onClick={() => void hide()}>
          {t("hide")}
        </Button>
      </HStack>
      <Progress.Root value={percent} size="sm" colorPalette="primary" mb={4} aria-label={t("progressLabel")}>
        <Progress.Track borderRadius="full">
          <Progress.Range />
        </Progress.Track>
      </Progress.Root>
      {error && (
        <Text color="critical.fg" fontSize="sm" fontWeight="600" mb={3} role="alert">
          {error}
        </Text>
      )}
      <VStack align="stretch" gap={2} role="list">
        {checklist.items.map((item) => {
          const inviteRole = actions[item.key];
          return (
            <HStack key={item.key} gap={3} bg="gray.50" borderRadius="xl" px={4} py={3} justify="space-between" role="listitem">
              <HStack gap={3} minW={0}>
                <Box color={item.done ? "secondary.fg" : "gray.400"} flexShrink={0}>
                  {item.done ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </Box>
                <Text color="gray.900" fontWeight="600">
                  {t(`items.${item.key}`)}
                  <Box as="span" srOnly>
                    {" "}
                    {item.done ? t("doneMark") : t("todoMark")}
                  </Box>
                </Text>
              </HStack>
              {!item.done && inviteRole && (
                <Button type="button" size="sm" minH="10" borderRadius="full" colorPalette="primary" variant="outline" disabled={readOnly} onClick={() => onInvite(inviteRole)}>
                  {t("invite")}
                </Button>
              )}
            </HStack>
          );
        })}
      </VStack>
    </Box>
  );
}
