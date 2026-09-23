import { Box, Container, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import { ArrowLeft, Home } from "lucide-react";
import { Blob } from "@/components/Blob";
import { Link } from "@/i18n/navigation";
import type { LegalLayoutProps } from "./LegalLayout.types";

/** Shared prose layout for standalone legal pages (Terms, Privacy) — calmer and less "marketing hero" than the landing/auth pages, per the design doc's "competent, not toy-like" rule for dense content. */
export function LegalLayout({ title, updatedLabel, intro, sections, backHomeLabel }: LegalLayoutProps) {
  return (
    <Box position="relative" overflow="hidden" minH="100vh" bg="gray.50">
      <Blob color="primary.100" size="240px" top="-70px" right="-60px" opacity={0.6} rotate={8} />

      <Box as="header" position="relative" zIndex={1}>
        <Container maxW="7xl" py={3}>
          <HStack asChild gap={2}>
            <Link href="/">
              <Box
                w={9}
                h={9}
                borderRadius="xl"
                bg="primary.emphasized"
                color="white"
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
              >
                <Home size={18} strokeWidth={2.5} />
              </Box>
              <Text fontFamily="heading" fontWeight="800" fontSize="xl" color="primary.fg">
                Kosly
              </Text>
            </Link>
          </HStack>
        </Container>
      </Box>

      <Container maxW="3xl" position="relative" zIndex={1} pb={{ base: 12, md: 20 }} pt={{ base: 2, md: 4 }}>
        <Box bg="white" borderRadius="2xl" boxShadow="card" p={{ base: 6, md: 10 }}>
          <Text
            asChild
            fontSize="sm"
            fontWeight="600"
            color="primary.fg"
            display="inline-flex"
            alignItems="center"
            gap={1.5}
            mb={6}
          >
            <Link href="/">
              <ArrowLeft size={16} />
              {backHomeLabel}
            </Link>
          </Text>

          <Heading as="h1" fontFamily="heading" fontWeight="800" fontSize={{ base: "3xl", md: "4xl" }} color="gray.900">
            {title}
          </Heading>
          <Text mt={2} fontSize="sm" color="gray.500">
            {updatedLabel}
          </Text>
          <Text mt={6} fontSize="md" color="gray.700" lineHeight="1.7">
            {intro}
          </Text>

          <VStack align="stretch" gap={7} mt={9}>
            {sections.map((section) => (
              <Box key={section.id}>
                <Heading as="h2" fontFamily="heading" fontWeight="700" fontSize="lg" color="gray.900" mb={2}>
                  {section.heading}
                </Heading>
                <Text fontSize="md" color="gray.700" lineHeight="1.7">
                  {section.body}
                </Text>
              </Box>
            ))}
          </VStack>
        </Box>
      </Container>
    </Box>
  );
}
