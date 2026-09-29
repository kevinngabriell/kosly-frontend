import { Badge, Box, HStack, Text, VStack } from "@chakra-ui/react";
import { Building2, KeyRound, MapPin, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { ROLE_PALETTE } from "@/lib/roles";
import type { InviteSummaryProps } from "./InviteSummary.types";

export function InviteSummary({ preview, variant = "card" }: InviteSummaryProps) {
  const t = useTranslations("invite.summary");
  const tRole = useTranslations("common.roles");
  const palette = ROLE_PALETTE[preview.role];

  if (variant === "banner") {
    return (
      <HStack
        gap={3}
        bg={`${palette}.subtle`}
        borderRadius="2xl"
        borderTopWidth="6px"
        borderTopColor={`${palette}.emphasized`}
        p={4}
        boxShadow="card"
        align="flex-start"
      >
        <Box
          w={10}
          h={10}
          borderRadius="xl"
          bg="white"
          color={`${palette}.fg`}
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
        >
          <Building2 size={20} />
        </Box>
        <Box minW={0}>
          <Text fontWeight="700" color="gray.900">
            {t("bannerTitle", { kos: preview.kosName, role: tRole(preview.role) })}
          </Text>
          <Text fontSize="sm" color="gray.700">
            {preview.roomName
              ? t("bannerBodyWithRoom", { owner: preview.ownerName, room: preview.roomName })
              : t("bannerBody", { owner: preview.ownerName })}
          </Text>
        </Box>
      </HStack>
    );
  }

  return (
    <VStack align="stretch" gap={4}>
      <HStack gap={3}>
        <Box
          w={12}
          h={12}
          borderRadius="xl"
          bg={`${palette}.subtle`}
          color={`${palette}.fg`}
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
        >
          <Building2 size={24} />
        </Box>
        <Box minW={0}>
          <Text fontFamily="heading" fontWeight="800" fontSize="xl" color="gray.900">
            {preview.kosName}
          </Text>
          <HStack gap={1.5} color="gray.600" fontSize="sm">
            <MapPin size={14} aria-hidden="true" />
            <Text>{preview.city}</Text>
          </HStack>
        </Box>
      </HStack>
      <VStack align="stretch" gap={2} bg="gray.50" borderRadius="xl" p={4}>
        <HStack gap={2} color="gray.800">
          <UserRound size={16} aria-hidden="true" />
          <Text fontSize="sm">{t("owner", { name: preview.ownerName })}</Text>
        </HStack>
        <HStack gap={2} color="gray.800">
          <KeyRound size={16} aria-hidden="true" />
          <Text fontSize="sm">{t("joiningAs")}</Text>
          <Badge colorPalette={palette} borderRadius="full" px={2.5}>
            {tRole(preview.role)}
          </Badge>
        </HStack>
        {preview.roomName && (
          <HStack gap={2} color="gray.800">
            <Building2 size={16} aria-hidden="true" />
            <Text fontSize="sm">{t("room", { room: preview.roomName })}</Text>
          </HStack>
        )}
      </VStack>
    </VStack>
  );
}
