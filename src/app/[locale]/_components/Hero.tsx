"use client";

import { Box, Button, Container, Heading, HStack, SimpleGrid, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Blob } from "@/components/Blob";
import { HeroStamp } from "./HeroStamp";

const PERSONA_DOTS = ["primary.emphasized", "secondary.emphasized", "accent.emphasized"];

export function Hero({ locale }: { locale: string }) {
  const t = useTranslations("landing.hero");
  const tNav = useTranslations("landing.nav");

  return (
    <Box id="top" as="section" position="relative" overflow="hidden" bg="primary.subtle">
      <Blob color="secondary.100" size="320px" top="-80px" right="-60px" opacity={0.9} rotate={12} />
      <Blob color="accent.200" size="220px" bottom="-40px" left="-40px" opacity={0.8} rotate={-8} />

      <Container maxW="7xl" py={{ base: 12, md: 20 }} position="relative" zIndex={1}>
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={{ base: 10, md: 16 }} alignItems="center">
          <Box>
            <HStack gap={2} bg="white" display="inline-flex" px={3} py={1.5} borderRadius="full" boxShadow="card" mb={5}>
              {PERSONA_DOTS.map((color) => (
                <Box key={color} w={2.5} h={2.5} borderRadius="full" bg={color} />
              ))}
              <Text fontSize="xs" fontWeight="700" color="gray.700">
                {tNav("forOwners")} · {tNav("forResidents")} · {tNav("forCaretakers")}
              </Text>
            </HStack>

            <Heading
              as="h1"
              fontFamily="heading"
              fontWeight="800"
              fontSize={{ base: "4xl", md: "5xl" }}
              color="gray.900"
              lineHeight="1.15"
            >
              {t("headline")}
            </Heading>
            <Text mt={5} fontSize={{ base: "md", md: "lg" }} color="gray.700" lineHeight="1.6" maxW="lg">
              {t("subheadline")}
            </Text>
            <Box mt={8} display="flex" flexWrap="wrap" gap={4}>
              <Button
                asChild
                colorPalette="primary"
                size="lg"
                minH="14"
                px={8}
                borderRadius="full"
                boxShadow="glow"
                _hover={{ transform: "translateY(-2px)", boxShadow: "cardHover" }}
                transition="transform 0.15s ease, box-shadow 0.15s ease"
              >
                <Link href="/register">{t("ctaPrimary")}</Link>
              </Button>
              <Button asChild variant="outline" colorPalette="primary" size="lg" minH="14" px={8} borderRadius="full" bg="white">
                <a href="#how-it-works">{t("ctaSecondary")}</a>
              </Button>
            </Box>
          </Box>

          <HeroStamp
            label={t("sampleAmountLabel")}
            badge={t("sampleBadge")}
            name={t("sampleName")}
            room={t("sampleRoom")}
            time={t("sampleTime")}
            locale={locale === "en" ? "en-US" : "id-ID"}
          />
        </SimpleGrid>
      </Container>
    </Box>
  );
}
