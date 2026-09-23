import { Box, Button, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

export function HowItWorksColumn({
  eyebrow,
  headline,
  steps,
  ctaLabel,
  ctaHref,
  colorPalette,
  icon,
}: {
  eyebrow: string;
  headline: string;
  steps: string[];
  ctaLabel: string;
  ctaHref: string;
  colorPalette: "primary" | "secondary" | "accent";
  icon: ReactNode;
}) {
  return (
    <Box
      bg="white"
      borderRadius="2xl"
      boxShadow="card"
      p={{ base: 6, md: 8 }}
      borderTopWidth="6px"
      borderTopColor={`${colorPalette}.emphasized`}
      h="full"
      display="flex"
      flexDirection="column"
      _hover={{ boxShadow: "cardHover", transform: "translateY(-4px)" }}
      transition="transform 0.2s ease, box-shadow 0.2s ease"
    >
      <Box
        w={12}
        h={12}
        borderRadius="xl"
        bg={`${colorPalette}.subtle`}
        color={`${colorPalette}.fg`}
        display="flex"
        alignItems="center"
        justifyContent="center"
        mb={4}
      >
        {icon}
      </Box>
      <Text fontSize="xs" fontWeight="700" color={`${colorPalette}.fg`} textTransform="uppercase" letterSpacing="wide">
        {eyebrow}
      </Text>
      <Heading as="h3" fontFamily="heading" fontWeight="700" fontSize="xl" color="gray.900" lineHeight="1.3" mt={1}>
        {headline}
      </Heading>
      <VStack align="stretch" gap={4} mt={6} flex="1">
        {steps.map((step, index) => (
          <HStack key={step} align="start" gap={3}>
            <Box
              flexShrink={0}
              w={6}
              h={6}
              borderRadius="full"
              bg={`${colorPalette}.muted`}
              color={`${colorPalette}.fg`}
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="xs"
              fontWeight="700"
              mt={0.5}
            >
              {index + 1}
            </Box>
            <Text color="gray.700" fontSize="sm" lineHeight="1.6">
              {step}
            </Text>
          </HStack>
        ))}
      </VStack>
      <Button
        asChild
        colorPalette={colorPalette}
        variant="outline"
        mt={7}
        minH="10"
        borderRadius="full"
        w={{ base: "full", md: "auto" }}
        alignSelf="flex-start"
      >
        <Link href={ctaHref}>{ctaLabel}</Link>
      </Button>
    </Box>
  );
}
