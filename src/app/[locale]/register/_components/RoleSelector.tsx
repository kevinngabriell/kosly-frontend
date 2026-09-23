"use client";

import { Box, RadioCard } from "@chakra-ui/react";
import { Check, Home, KeyRound, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { ROLES, ROLE_PALETTE, type Role } from "./register.types";

const ROLE_ICONS: Record<Role, ReactNode> = {
  owner: <Home size={20} />,
  tenant: <KeyRound size={20} />,
  caretaker: <Wrench size={20} />,
};

export function RoleSelector({
  role,
  onChange,
  ariaLabel,
}: {
  role: Role;
  onChange: (role: Role) => void;
  ariaLabel: string;
}) {
  const t = useTranslations("register.role");

  return (
    <RadioCard.Root
      name="role"
      aria-label={ariaLabel}
      value={role}
      onValueChange={(details) => {
        if (details.value) onChange(details.value as Role);
      }}
      display="grid"
      gridTemplateColumns={{ base: "1fr", sm: "repeat(3, 1fr)" }}
      gap={4}
    >
      {ROLES.map((value) => {
        const palette = ROLE_PALETTE[value];
        const checked = value === role;

        return (
          <RadioCard.Item
            key={value}
            value={value}
            colorPalette={palette}
            position="relative"
            bg="white"
            borderRadius="2xl"
            borderWidth="2px"
            borderColor="gray.200"
            borderTopWidth="6px"
            borderTopColor="gray.200"
            boxShadow="card"
            cursor="pointer"
            _hover={{ boxShadow: "cardHover", transform: "translateY(-2px)" }}
            _checked={{
              borderColor: `${palette}.muted`,
              borderTopColor: `${palette}.emphasized`,
              boxShadow: "cardHover",
            }}
            transition="transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease"
          >
            <RadioCard.ItemHiddenInput />
            <RadioCard.ItemControl p={5} gap={3} alignItems="flex-start">
              <Box
                w={10}
                h={10}
                borderRadius="xl"
                bg={`${palette}.subtle`}
                color={`${palette}.fg`}
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
              >
                {ROLE_ICONS[value]}
              </Box>
              <RadioCard.ItemContent gap={1}>
                <RadioCard.ItemText fontWeight="700" color="gray.900">
                  {t(`${value}.label`)}
                </RadioCard.ItemText>
                <RadioCard.ItemDescription fontSize="xs" color="gray.600">
                  {t(`${value}.description`)}
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
                bg={`${palette}.solid`}
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
