"use client";

import { Badge, Box, Menu, Portal, Text } from "@chakra-ui/react";
import { KeyRound, LogOut, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { UserMenuProps } from "./UserMenu.types";

function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export function UserMenu({ me, onLogout }: UserMenuProps) {
  const t = useTranslations("app.userMenu");
  const owns = me.memberships.some((m) => m.role === "owner");
  // Offer "add a kos" to owners (so they find the upgrade path) and to anyone still allowed to add one.
  const showAddKos = owns || me.canAddKos;

  return (
    <Menu.Root positioning={{ placement: "bottom-end" }}>
      <Menu.Trigger asChild>
        <Box
          as="button"
          aria-label={t("open")}
          w={10}
          h={10}
          borderRadius="full"
          bg="primary.subtle"
          color="primary.fg"
          fontWeight="800"
          fontFamily="heading"
          display="flex"
          alignItems="center"
          justifyContent="center"
          cursor="pointer"
          _hover={{ bg: "primary.muted" }}
        >
          {initialOf(me.user.fullName)}
        </Box>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content minW="64" borderRadius="xl" boxShadow="cardHover">
            <Box px={3} py={2}>
              <Text fontWeight="700" color="gray.900" truncate>
                {me.user.fullName}
              </Text>
              <Text fontSize="sm" color="gray.600" truncate>
                {me.user.email}
              </Text>
              {owns && (
                <Badge mt={2} colorPalette={me.user.plan === "pro" ? "primary" : "gray"} borderRadius="full">
                  {t(`plan.${me.user.plan}`)}
                </Badge>
              )}
            </Box>
            <Menu.Separator />
            {showAddKos && (
              <Menu.Item value="add-kos" asChild minH="10">
                <Link href="/app/kos/new">
                  <Plus size={16} />
                  {t("addKos")}
                </Link>
              </Menu.Item>
            )}
            <Menu.Item value="join" asChild minH="10">
              <Link href="/join">
                <KeyRound size={16} />
                {t("joinKos")}
              </Link>
            </Menu.Item>
            <Menu.Separator />
            <Menu.Item value="logout" minH="10" onClick={onLogout}>
              <LogOut size={16} />
              {t("logout")}
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
