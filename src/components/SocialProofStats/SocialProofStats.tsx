import { Box, Container, Heading, SimpleGrid, Text } from "@chakra-ui/react";
import { getLocale, getTranslations } from "next-intl/server";
import { apiFetch } from "@/lib/api-client";
import type { PublicStats } from "./SocialProofStats.types";

// Placeholder cutoff — a real-but-tiny number still reads as sparse. Final value
// pending PM confirmation; see kosly-api-requirements.md.
const VERIFIED_TRANSACTIONS_THRESHOLD = 50;

async function fetchPublicStats(): Promise<PublicStats | null> {
  try {
    const res = await apiFetch("/api/v1/public/stats", {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as Partial<PublicStats>;
    if (
      typeof data.verified_transactions_count !== "number" ||
      typeof data.properties_count !== "number" ||
      typeof data.cities_count !== "number"
    ) {
      return null;
    }

    return data as PublicStats;
  } catch {
    // Fails silently by design — this section is reinforcement, not load-bearing.
    return null;
  }
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <Box textAlign="center">
      <Text fontFamily="heading" fontWeight="800" fontSize={{ base: "3xl", md: "4xl" }} color="white">
        {value}
      </Text>
      <Text mt={1} fontSize="sm" color="whiteAlpha.900">
        {label}
      </Text>
    </Box>
  );
}

export async function SocialProofStats() {
  const t = await getTranslations("landing.socialProof");
  const locale = await getLocale();
  const stats = await fetchPublicStats();
  const showStats = stats !== null && stats.verified_transactions_count >= VERIFIED_TRANSACTIONS_THRESHOLD;
  const numberFormat = new Intl.NumberFormat(locale === "en" ? "en-US" : "id-ID");

  return (
    <Box as="section" bgGradient="to-r" gradientFrom="primary.700" gradientTo="secondary.700" py={{ base: 12, md: 16 }}>
      <Container maxW="7xl">
        <Text
          textAlign="center"
          fontSize="sm"
          fontWeight="700"
          letterSpacing="wide"
          color="whiteAlpha.900"
          textTransform="uppercase"
        >
          {t("eyebrow")}
        </Text>

        {showStats && stats ? (
          <SimpleGrid columns={{ base: 1, sm: 3 }} gap={8} mt={6}>
            <StatTile
              value={numberFormat.format(stats.verified_transactions_count)}
              label={t("verifiedTransactionsLabel")}
            />
            <StatTile value={numberFormat.format(stats.properties_count)} label={t("propertiesLabel")} />
            <StatTile value={numberFormat.format(stats.cities_count)} label={t("citiesLabel")} />
          </SimpleGrid>
        ) : (
          <Heading
            as="p"
            textAlign="center"
            mt={6}
            fontFamily="heading"
            fontWeight="800"
            fontSize={{ base: "xl", md: "2xl" }}
            color="white"
            maxW="2xl"
            mx="auto"
            lineHeight="1.4"
          >
            {t("earlyAccessHeadline")}
          </Heading>
        )}
      </Container>
    </Box>
  );
}
