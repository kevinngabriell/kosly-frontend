"use client";

import { Box, Button, Heading, Text, VStack } from "@chakra-ui/react";
import { CheckCircle2, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { apiJson } from "@/lib/api-client";
import { useApiErrorMessage } from "@/lib/useApiErrorMessage";
import type { UpgradePromptProps } from "./UpgradePrompt.types";

/**
 * The paid plan isn't purchasable yet, so hitting the free plan's limit leads to a waitlist instead of a
 * checkout. Joining is idempotent on the API side.
 */
export function UpgradePrompt({ reason, backHref }: UpgradePromptProps) {
  const t = useTranslations("upgrade");
  const errorMessage = useApiErrorMessage();
  const [status, setStatus] = useState<"idle" | "busy" | "joined">("idle");
  const [error, setError] = useState<string | null>(null);

  async function join() {
    setStatus("busy");
    setError(null);
    try {
      await apiJson<void>("/api/v1/billing/waitlist", { method: "POST", body: {} });
      setStatus("joined");
    } catch (caught) {
      setError(errorMessage(caught));
      setStatus("idle");
    }
  }

  return (
    <VStack gap={4} textAlign="center" bg="white" borderRadius="2xl" boxShadow="card" p={{ base: 6, md: 10 }}>
      <Box w={14} h={14} borderRadius="full" bg="primary.subtle" color="primary.fg" display="flex" alignItems="center" justifyContent="center">
        {status === "joined" ? <CheckCircle2 size={26} /> : <Sparkles size={26} />}
      </Box>
      <Heading as="h1" fontFamily="heading" fontWeight="800" fontSize="2xl" color="gray.900">
        {status === "joined" ? t("joined.title") : t(`${reason}.title`)}
      </Heading>
      <Text color="gray.700" maxW="md">
        {status === "joined" ? t("joined.body") : t(`${reason}.body`)}
      </Text>
      {error && (
        <Text color="critical.fg" fontSize="sm" fontWeight="600" role="alert">
          {error}
        </Text>
      )}
      {status !== "joined" && (
        <Button type="button" colorPalette="primary" size="lg" minH="12" borderRadius="full" px={8} loading={status === "busy"} onClick={() => void join()}>
          {t("join")}
        </Button>
      )}
      <Button asChild variant="ghost" minH="10">
        <Link href={backHref}>{t("back")}</Link>
      </Button>
    </VStack>
  );
}
