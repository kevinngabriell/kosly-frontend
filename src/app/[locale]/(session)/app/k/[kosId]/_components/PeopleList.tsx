"use client";

import { Badge, Box, HStack, Text, VStack } from "@chakra-ui/react";
import { Flag, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PersonDto } from "@/lib/api-types";

/** A titled list of people in a kos. The room-details flag is only ever passed in for owners. */
export function PeopleList({
  title,
  empty,
  people,
  palette,
}: {
  title: string;
  empty: string;
  people: PersonDto[];
  palette: "secondary" | "accent";
}) {
  const t = useTranslations("kos.people");

  return (
    <Box bg="white" borderRadius="2xl" boxShadow="card" p={5}>
      <HStack justify="space-between" mb={3}>
        <Text fontFamily="heading" fontWeight="700" fontSize="lg" color="gray.900">
          {title}
        </Text>
        <Badge colorPalette={palette} borderRadius="full" px={2.5}>
          {people.length}
        </Badge>
      </HStack>
      {people.length === 0 ? (
        <Text color="gray.600" fontSize="sm">
          {empty}
        </Text>
      ) : (
        <VStack align="stretch" gap={2} role="list">
          {people.map((person) => (
            <HStack key={person.membershipId} gap={3} bg="gray.50" borderRadius="xl" px={4} py={3} justify="space-between" flexWrap="wrap" role="listitem">
              <Box minW={0}>
                <Text fontWeight="600" color="gray.900" truncate>
                  {person.fullName}
                </Text>
                {person.roomName && (
                  <Text fontSize="sm" color="gray.600">
                    {t("room", { name: person.roomName })}
                  </Text>
                )}
              </Box>
              <HStack gap={2}>
                {person.roomFlagged && (
                  <Badge colorPalette="orange" borderRadius="full" px={2.5} gap={1}>
                    <Flag size={12} aria-hidden="true" />
                    {t("flagged")}
                  </Badge>
                )}
                {person.phone && (
                  <Text asChild fontSize="sm" color="gray.700" display="inline-flex" alignItems="center" gap={1.5} minH="8">
                    <a href={`tel:${person.phone}`} aria-label={t("call", { name: person.fullName })}>
                      <Phone size={14} aria-hidden="true" />
                      {person.phone}
                    </a>
                  </Text>
                )}
              </HStack>
            </HStack>
          ))}
        </VStack>
      )}
    </Box>
  );
}
