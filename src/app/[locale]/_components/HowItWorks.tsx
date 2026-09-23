import { Box, Container, Heading, SimpleGrid } from "@chakra-ui/react";
import { Building2, ClipboardCheck, UserRound } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { HowItWorksColumn } from "./HowItWorksColumn";
import { HowItWorksTabs } from "./HowItWorksTabs";

export async function HowItWorks() {
  const t = await getTranslations("landing.howItWorks");

  const owner = {
    eyebrow: t("owner.eyebrow"),
    tabLabel: t("owner.tabLabel"),
    headline: t("owner.headline"),
    steps: [t("owner.step1"), t("owner.step2"), t("owner.step3")],
    ctaLabel: t("owner.cta"),
    ctaHref: "/register?role=owner",
    colorPalette: "primary" as const,
    icon: <Building2 size={22} strokeWidth={2.25} />,
  };

  const resident = {
    eyebrow: t("resident.eyebrow"),
    tabLabel: t("resident.tabLabel"),
    headline: t("resident.headline"),
    steps: [t("resident.step1"), t("resident.step2"), t("resident.step3")],
    ctaLabel: t("resident.cta"),
    ctaHref: "/register?role=tenant",
    colorPalette: "secondary" as const,
    icon: <UserRound size={22} strokeWidth={2.25} />,
  };

  const caretaker = {
    eyebrow: t("caretaker.eyebrow"),
    tabLabel: t("caretaker.tabLabel"),
    headline: t("caretaker.headline"),
    steps: [t("caretaker.step1"), t("caretaker.step2"), t("caretaker.step3")],
    ctaLabel: t("caretaker.cta"),
    ctaHref: "/register?role=caretaker",
    colorPalette: "accent" as const,
    icon: <ClipboardCheck size={22} strokeWidth={2.25} />,
  };

  return (
    <Box id="how-it-works" as="section" bg="gray.50" py={{ base: 12, md: 20 }}>
      <Container maxW="7xl">
        <Heading
          as="h2"
          textAlign="center"
          fontFamily="heading"
          fontWeight="800"
          fontSize={{ base: "2xl", md: "3xl" }}
          color="gray.900"
          mb={{ base: 8, md: 12 }}
        >
          {t("eyebrow")}
        </Heading>

        <Box display={{ base: "none", md: "block" }}>
          <SimpleGrid columns={3} gap={8}>
            <HowItWorksColumn {...owner} />
            <HowItWorksColumn {...resident} />
            <HowItWorksColumn {...caretaker} />
          </SimpleGrid>
        </Box>

        <Box display={{ base: "block", md: "none" }}>
          <HowItWorksTabs owner={owner} resident={resident} caretaker={caretaker} />
        </Box>
      </Container>
    </Box>
  );
}
