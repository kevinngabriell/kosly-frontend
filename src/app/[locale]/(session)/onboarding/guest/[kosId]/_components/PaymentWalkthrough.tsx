"use client";

import { Badge, Box, Button, HStack, Text, VStack } from "@chakra-ui/react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CurrencyInput } from "@/components/CurrencyInput";
import { formatIdr } from "@/lib/format";

const SAMPLE_ROOMS = [
  { name: "1A", rent: 850_000 },
  { name: "1B", rent: 900_000 },
  { name: "2A", rent: 800_000 },
];

/**
 * A practice run of logging a payment, so a caretaker's first real one isn't their first try. Nothing here
 * is sent anywhere.
 */
export function PaymentWalkthrough({ onDone }: { onDone: () => void }) {
  const t = useTranslations("guestOnboarding.walkthrough");
  const [room, setRoom] = useState<(typeof SAMPLE_ROOMS)[number] | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  const stage = saved ? 4 : !room ? 1 : 2;

  return (
    <VStack align="stretch" gap={5}>
      <HStack justify="space-between">
        <Text fontWeight="700" color="gray.900">
          {t("title")}
        </Text>
        <Badge colorPalette="accent" borderRadius="full" px={2.5}>
          {t("practice")}
        </Badge>
      </HStack>

      {stage === 1 && (
        <VStack align="stretch" gap={3}>
          <Text color="gray.700">{t("step1")}</Text>
          {SAMPLE_ROOMS.map((sample) => (
            <Button
              key={sample.name}
              type="button"
              variant="outline"
              justifyContent="space-between"
              minH="14"
              borderRadius="xl"
              onClick={() => {
                setRoom(sample);
                setAmount(sample.rent);
              }}
            >
              <span>{t("sampleRoom", { name: sample.name })}</span>
              <span>{formatIdr(sample.rent)}</span>
            </Button>
          ))}
        </VStack>
      )}

      {stage === 2 && room && (
        <VStack align="stretch" gap={4}>
          <Text color="gray.700">{t("step2", { room: room.name })}</Text>
          <CurrencyInput value={amount} onChange={setAmount} aria-label={t("amountLabel")} />
          <Button type="button" colorPalette="accent" size="lg" minH="14" borderRadius="full" disabled={!amount} onClick={() => setSaved(true)}>
            {t("save")}
          </Button>
          <Button type="button" variant="ghost" minH="10" onClick={() => setRoom(null)}>
            {t("changeRoom")}
          </Button>
        </VStack>
      )}

      {stage === 4 && room && (
        <VStack align="stretch" gap={4}>
          <HStack gap={3} bg="secondary.subtle" borderRadius="xl" p={4} align="flex-start" role="status">
            <Box color="secondary.fg" mt={0.5}>
              <CheckCircle2 size={22} />
            </Box>
            <Box>
              <Text fontWeight="700" color="gray.900">
                {t("savedTitle", { amount: formatIdr(amount ?? 0), room: room.name })}
              </Text>
              <HStack gap={1.5} color="gray.700" fontSize="sm" mt={1}>
                <ShieldCheck size={14} aria-hidden="true" />
                <Text>{t("savedNote")}</Text>
              </HStack>
            </Box>
          </HStack>
          <Button type="button" colorPalette="accent" size="lg" minH="14" borderRadius="full" onClick={onDone}>
            {t("finish")}
          </Button>
        </VStack>
      )}
    </VStack>
  );
}
