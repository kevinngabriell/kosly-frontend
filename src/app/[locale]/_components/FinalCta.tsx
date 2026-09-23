import { Box, Button, Container, Heading } from "@chakra-ui/react";
import { getTranslations } from "next-intl/server";
import { Blob } from "@/components/Blob";
import { Link } from "@/i18n/navigation";

const PERSONAS = [
  { role: "owner", href: "/register?role=owner", messageKey: "ownerButton", colorPalette: "primary" as const },
  { role: "resident", href: "/register?role=tenant", messageKey: "residentButton", colorPalette: "secondary" as const },
  { role: "caretaker", href: "/register?role=caretaker", messageKey: "caretakerButton", colorPalette: "accent" as const },
];

export async function FinalCta() {
  const t = await getTranslations("landing.finalCta");

  return (
    <Box as="section" position="relative" overflow="hidden" py={{ base: 12, md: 20 }} bg="primary.subtle">
      <Blob color="secondary.100" size="240px" top="-60px" left="-50px" opacity={0.7} rotate={-10} />
      <Blob color="accent.200" size="180px" bottom="-50px" right="-40px" opacity={0.75} rotate={14} />

      <Container maxW="2xl" position="relative" zIndex={1} textAlign="center">
        <Heading as="h2" fontFamily="heading" fontWeight="800" fontSize={{ base: "2xl", md: "3xl" }} color="gray.900">
          {t("headline")}
        </Heading>
        <Box mt={8} display="flex" flexWrap="wrap" justifyContent="center" gap={4}>
          {PERSONAS.map(({ role, href, messageKey, colorPalette }) => (
            <Button
              key={role}
              asChild
              colorPalette={colorPalette}
              size="lg"
              minH="14"
              px={8}
              borderRadius="full"
              _hover={{ transform: "translateY(-2px)", boxShadow: "cardHover" }}
              transition="transform 0.15s ease, box-shadow 0.15s ease"
            >
              <Link href={href}>{t(messageKey)}</Link>
            </Button>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
