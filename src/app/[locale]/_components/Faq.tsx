"use client";

import { Accordion, Box, Container, Heading, Span, Text } from "@chakra-ui/react";
import { ChevronDown, ClipboardCheck, HelpCircle, PiggyBank, ShieldCheck, Users, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { Blob } from "@/components/Blob";

const FAQ_ITEMS = [
  { key: "ownerCaretaker", icon: Users, colorPalette: "primary" as const },
  { key: "caretakerWorkload", icon: ClipboardCheck, colorPalette: "accent" as const },
  { key: "dataSafety", icon: ShieldCheck, colorPalette: "secondary" as const },
  { key: "residentCash", icon: Wallet, colorPalette: "primary" as const },
  { key: "residentDeposit", icon: PiggyBank, colorPalette: "accent" as const },
];

export function Faq() {
  const t = useTranslations("landing.faq");

  return (
    <Box as="section" py={{ base: 12, md: 20 }} bg="gray.50" position="relative" overflow="hidden">
      <Blob color="secondary.100" size="220px" top="-40px" left="-60px" opacity={0.6} rotate={20} />

      <Container maxW="3xl" position="relative" zIndex={1}>
        <Box textAlign="center" mb={{ base: 8, md: 10 }}>
          <Box
            w={12}
            h={12}
            mx="auto"
            mb={4}
            borderRadius="full"
            bg="primary.subtle"
            color="primary.fg"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <HelpCircle size={24} strokeWidth={2.25} />
          </Box>
          <Heading as="h2" fontFamily="heading" fontWeight="800" fontSize={{ base: "2xl", md: "3xl" }} color="gray.900">
            {t("eyebrow")}
          </Heading>
        </Box>

        <Accordion.Root collapsible multiple display="flex" flexDirection="column" gap={4}>
          {FAQ_ITEMS.map(({ key, icon: Icon, colorPalette }) => (
            <Accordion.Item
              key={key}
              value={key}
              bg="white"
              borderRadius="2xl"
              boxShadow="card"
              border="none"
              overflow="hidden"
              _hover={{ boxShadow: "cardHover" }}
              transition="box-shadow 0.2s ease"
            >
              <Accordion.ItemTrigger minH="16" px={{ base: 4, md: 6 }} py={4} gap={3}>
                <Box
                  flexShrink={0}
                  w={9}
                  h={9}
                  borderRadius="lg"
                  bg={`${colorPalette}.subtle`}
                  color={`${colorPalette}.fg`}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon size={16} strokeWidth={2.25} />
                </Box>
                <Span flex="1" textAlign="left" fontWeight="700" color="gray.900">
                  {t(`${key}.question`)}
                </Span>
                <Accordion.ItemIndicator color={`${colorPalette}.fg`}>
                  <ChevronDown size={18} />
                </Accordion.ItemIndicator>
              </Accordion.ItemTrigger>
              <Accordion.ItemContent>
                <Accordion.ItemBody px={{ base: 4, md: 6 }} pb={5} pt={0} pl={{ base: "52px", md: "60px" }}>
                  <Text color="gray.700" fontSize="sm" lineHeight="1.6">
                    {t(`${key}.answer`)}
                  </Text>
                </Accordion.ItemBody>
              </Accordion.ItemContent>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </Container>
    </Box>
  );
}
