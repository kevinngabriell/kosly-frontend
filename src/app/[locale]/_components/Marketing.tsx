import { Badge, Box, Container, Heading, Text } from "@chakra-ui/react";
import { Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Blob } from "@/components/Blob";

export async function Marketing() {
  const t = await getTranslations("landing.marketing");

  return (
    <Box as="section" py={{ base: 12, md: 20 }}>
      <Container maxW="7xl">
        <Box
          position="relative"
          overflow="hidden"
          w="full"
          bg="accent.subtle"
          borderRadius="2xl"
          borderWidth="2px"
          borderColor="accent.500"
          p={{ base: 8, md: 12 }}
          textAlign="center"
        >
          <Blob color="accent.200" size="200px" top="-60px" right="-50px" opacity={0.7} />

          <Box position="relative" zIndex={1} maxW="2xl" mx="auto">
            <Box
              w={12}
              h={12}
              mx="auto"
              mb={4}
              borderRadius="full"
              bg="accent.solid"
              color="accent.contrast"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Sparkles size={22} strokeWidth={2.25} />
            </Box>
            <Badge
              colorPalette="accent"
              variant="subtle"
              borderWidth="1.5px"
              borderColor="accent.600"
              borderRadius="full"
              px={3}
              py={1}
              mb={3}
            >
              {t("badge")}
            </Badge>
            <Text fontSize="sm" fontWeight="700" color="accent.fg" textTransform="uppercase" letterSpacing="wide">
              {t("eyebrow")}
            </Text>
            <Heading as="h2" fontFamily="heading" fontWeight="800" fontSize={{ base: "xl", md: "2xl" }} color="gray.900" mt={2}>
              {t("headline")}
            </Heading>
            <Text mt={4} fontSize="md" color="gray.700" lineHeight="1.6">
              {t("body")}
            </Text>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
