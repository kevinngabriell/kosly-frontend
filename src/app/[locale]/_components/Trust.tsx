import { Box, Container, Heading, HStack, SimpleGrid, Text } from "@chakra-ui/react";
import { CheckCircle2, Eye, ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";

const FEATURES = [
  { key: "feature1", icon: CheckCircle2, colorPalette: "primary" as const },
  { key: "feature2", icon: ShieldCheck, colorPalette: "secondary" as const },
  { key: "feature3", icon: Eye, colorPalette: "accent" as const },
];

export async function Trust() {
  const t = await getTranslations("landing.trust");

  return (
    <Box as="section" py={{ base: 12, md: 20 }}>
      <Container maxW="7xl">
        <Box textAlign="center" maxW="2xl" mx="auto">
          <Heading as="h2" fontFamily="heading" fontWeight="800" fontSize={{ base: "2xl", md: "3xl" }} color="gray.900">
            {t("eyebrow")}
          </Heading>
          <Text mt={4} fontSize="md" color="gray.700" lineHeight="1.6">
            {t("body")}
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 3 }} gap={6} mt={10}>
          {FEATURES.map(({ key, icon: Icon, colorPalette }) => (
            <Box
              key={key}
              bg="white"
              borderRadius="2xl"
              boxShadow="card"
              p={6}
              textAlign="center"
              _hover={{ boxShadow: "cardHover", transform: "translateY(-4px)" }}
              transition="transform 0.2s ease, box-shadow 0.2s ease"
            >
              <Box
                w={14}
                h={14}
                mx="auto"
                borderRadius="full"
                bg={`${colorPalette}.subtle`}
                color={`${colorPalette}.fg`}
                display="flex"
                alignItems="center"
                justifyContent="center"
                mb={4}
              >
                <Icon size={26} strokeWidth={2.25} />
              </Box>
              <Heading as="h3" fontFamily="heading" fontWeight="700" fontSize="lg" color="gray.900">
                {t(`${key}Title`)}
              </Heading>
              <Text mt={2} fontSize="sm" color="gray.700" lineHeight="1.6">
                {t(`${key}Body`)}
              </Text>
            </Box>
          ))}
        </SimpleGrid>

        <HStack justify="center" mt={10}>
          <HStack bg="secondary.subtle" color="secondary.fg" px={4} py={2} borderRadius="full" gap={2}>
            <CheckCircle2 size={16} />
            <Text fontFamily="heading" fontWeight="700" fontSize="sm">
              {t("tagline")}
            </Text>
          </HStack>
        </HStack>
      </Container>
    </Box>
  );
}
