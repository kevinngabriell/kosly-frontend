"use client";

import { Box, Button, Container, Heading, Text } from "@chakra-ui/react";
import { motion, useReducedMotion } from "framer-motion";
import { DoorClosed } from "lucide-react";
import { Blob } from "@/components/Blob";
import type { NotFoundViewProps } from "./NotFoundView.types";

const MotionBox = motion.create(Box);

/** Shared 404 content rendered from both the in-app `[locale]/not-found.tsx` boundary and the standalone `global-not-found.tsx` route, so the two never drift apart visually. */
export function NotFoundView({ headline, body, homeLabel, homeHref, dashboardLabel, dashboardHref }: NotFoundViewProps) {
  const reduceMotion = useReducedMotion();

  return (
    <Box
      as="section"
      position="relative"
      overflow="hidden"
      bg="primary.subtle"
      minH="100vh"
      display="flex"
      alignItems="center"
    >
      <Blob color="secondary.100" size="300px" top="-70px" right="-60px" opacity={0.8} rotate={12} />
      <Blob color="accent.200" size="220px" bottom="-50px" left="-50px" opacity={0.75} rotate={-10} />

      <Container maxW="2xl" py={{ base: 16, md: 24 }} position="relative" zIndex={1} textAlign="center">
        <MotionBox
          initial={reduceMotion ? false : { scale: 0.6, rotate: -18, opacity: 0 }}
          animate={{ scale: 1, rotate: -8, opacity: 1 }}
          transition={{ duration: 0.5, ease: "backOut" }}
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          w={20}
          h={20}
          borderRadius="full"
          bg="primary.solid"
          color="white"
          boxShadow="glow"
          mb={6}
        >
          <DoorClosed size={36} strokeWidth={2.25} />
        </MotionBox>

        <Text
          fontFamily="heading"
          fontWeight="800"
          fontSize={{ base: "7xl", md: "8xl" }}
          color="primary.emphasized"
          lineHeight="1"
        >
          404
        </Text>

        <Heading
          as="h1"
          fontFamily="heading"
          fontWeight="800"
          fontSize={{ base: "2xl", md: "3xl" }}
          color="gray.900"
          mt={4}
        >
          {headline}
        </Heading>
        <Text mt={3} fontSize={{ base: "md", md: "lg" }} color="gray.700" lineHeight="1.6" maxW="md" mx="auto">
          {body}
        </Text>

        <Box mt={8} display="flex" flexWrap="wrap" justifyContent="center" gap={4}>
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
            <a href={homeHref}>{homeLabel}</a>
          </Button>
          <Button asChild variant="outline" colorPalette="primary" size="lg" minH="14" px={8} borderRadius="full" bg="white">
            <a href={dashboardHref}>{dashboardLabel}</a>
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
