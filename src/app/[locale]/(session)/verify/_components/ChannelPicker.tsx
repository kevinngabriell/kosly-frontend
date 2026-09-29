"use client";

import { Box, RadioCard } from "@chakra-ui/react";
import { Check, Mail, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { VerificationChannel } from "@/lib/api-types";

const CHANNELS: VerificationChannel[] = ["email", "whatsapp"];

export function ChannelPicker({
  value,
  onChange,
  disabled,
}: {
  value: VerificationChannel;
  onChange: (channel: VerificationChannel) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("verify.channel");

  return (
    <RadioCard.Root
      name="channel"
      aria-label={t("label")}
      value={value}
      disabled={disabled}
      onValueChange={(details) => {
        if (details.value) onChange(details.value as VerificationChannel);
      }}
      display="grid"
      gridTemplateColumns={{ base: "1fr", sm: "repeat(2, 1fr)" }}
      gap={3}
    >
      {CHANNELS.map((channel) => {
        const checked = channel === value;
        return (
          <RadioCard.Item
            key={channel}
            value={channel}
            colorPalette="primary"
            position="relative"
            bg="white"
            borderRadius="2xl"
            borderWidth="2px"
            borderColor="gray.200"
            cursor="pointer"
            _checked={{ borderColor: "primary.emphasized", boxShadow: "card" }}
          >
            <RadioCard.ItemHiddenInput />
            <RadioCard.ItemControl p={4} gap={3} alignItems="flex-start">
              <Box
                w={10}
                h={10}
                borderRadius="xl"
                bg="primary.subtle"
                color="primary.fg"
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
              >
                {channel === "email" ? <Mail size={20} /> : <MessageCircle size={20} />}
              </Box>
              <RadioCard.ItemContent gap={0.5}>
                <RadioCard.ItemText fontWeight="700" color="gray.900">
                  {t(`${channel}.label`)}
                </RadioCard.ItemText>
                <RadioCard.ItemDescription fontSize="xs" color="gray.600">
                  {t(`${channel}.description`)}
                </RadioCard.ItemDescription>
              </RadioCard.ItemContent>
            </RadioCard.ItemControl>
            {checked && (
              <Box
                position="absolute"
                top={3}
                right={3}
                w={5}
                h={5}
                borderRadius="full"
                bg="primary.solid"
                color="white"
                display="flex"
                alignItems="center"
                justifyContent="center"
                aria-hidden="true"
              >
                <Check size={12} strokeWidth={3} />
              </Box>
            )}
          </RadioCard.Item>
        );
      })}
    </RadioCard.Root>
  );
}
