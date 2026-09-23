"use client";

import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";

const MotionBox = motion.create(Box);

export function HeroStamp({
  label,
  badge,
  name,
  room,
  time,
  locale,
}: {
  label: string;
  badge: string;
  name: string;
  room: string;
  time: string;
  locale: string;
}) {
  const reduceMotion = useReducedMotion();
  const amount = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(750000);

  return (
    <Box textAlign="center" position="relative">
      <MotionBox
        initial={reduceMotion ? false : { opacity: 0, y: 16, rotate: -2 }}
        animate={{ opacity: 1, y: 0, rotate: -2 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        display="inline-block"
      >
        <Box bg="white" borderRadius="2xl" boxShadow="cardHover" p={6} position="relative" maxW="xs" textAlign="left">
          <MotionBox
            position="absolute"
            top="-16px"
            right="-16px"
            initial={reduceMotion ? false : { scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: -12 }}
            transition={{ delay: 0.3, duration: 0.35, ease: "backOut" }}
            bg="secondary.solid"
            color="white"
            borderRadius="full"
            w={14}
            h={14}
            display="flex"
            alignItems="center"
            justifyContent="center"
            boxShadow="glow"
          >
            <Check size={26} strokeWidth={3} />
          </MotionBox>

          <HStack gap={3}>
            <Box
              flexShrink={0}
              w={10}
              h={10}
              borderRadius="full"
              bg="secondary.subtle"
              color="secondary.fg"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontFamily="heading"
              fontWeight="700"
              fontSize="md"
            >
              {name.charAt(0)}
            </Box>
            <VStack align="start" gap={0}>
              <Text fontWeight="700" fontSize="sm" color="gray.900">
                {name}
              </Text>
              <Text fontSize="xs" color="gray.500">
                {room}
              </Text>
            </VStack>
          </HStack>

          <Box mt={5} pt={4} borderTopWidth="1px" borderColor="gray.100">
            <Text fontSize="xs" fontWeight="700" color="secondary.fg" textTransform="uppercase" letterSpacing="wide">
              {badge}
            </Text>
            <Text
              mt={1}
              fontFamily="heading"
              fontWeight="800"
              fontSize={{ base: "3xl", md: "4xl" }}
              color="gray.900"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {amount}
            </Text>
            <Text mt={1} fontSize="xs" color="gray.500">
              {time}
            </Text>
          </Box>
        </Box>
      </MotionBox>
      <Text mt={4} fontSize="xs" color="gray.600" fontWeight="600">
        {label}
      </Text>
    </Box>
  );
}
