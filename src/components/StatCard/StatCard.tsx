import { Box, HStack, Text } from "@chakra-ui/react";
import type { StatCardProps } from "./StatCard.types";

export function StatCard({ label, value, hint, icon, colorPalette = "primary" }: StatCardProps) {
  return (
    <Box bg="white" borderRadius="2xl" boxShadow="card" p={5}>
      <HStack gap={3} align="flex-start">
        <Box
          w={10}
          h={10}
          borderRadius="xl"
          bg={`${colorPalette}.subtle`}
          color={`${colorPalette}.fg`}
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
        >
          {icon}
        </Box>
        <Box minW={0}>
          <Text fontSize="sm" color="gray.600">
            {label}
          </Text>
          <Text
            fontFamily="heading"
            fontWeight="800"
            fontSize="2xl"
            color="gray.900"
            lineHeight="1.2"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {value}
          </Text>
          {hint && (
            <Text fontSize="xs" color="gray.600" mt={0.5}>
              {hint}
            </Text>
          )}
        </Box>
      </HStack>
    </Box>
  );
}
