"use client";

import { Box, Button, HStack, Text } from "@chakra-ui/react";
import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import type { CopyFieldProps } from "./CopyField.types";

export function CopyField({ label, value, copyLabel, copiedLabel }: CopyFieldProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // Clipboard can be blocked (insecure origin, permissions). The value stays visible and selectable.
      setCopied(false);
    }
  }

  return (
    <Box>
      <Text fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="wide" mb={1}>
        {label}
      </Text>
      <HStack gap={2} bg="gray.50" borderRadius="xl" pl={4} pr={1.5} py={1.5} justify="space-between">
        <Text fontWeight="700" color="gray.900" wordBreak="break-all" userSelect="all">
          {value}
        </Text>
        <Button type="button" size="sm" minH="10" borderRadius="full" variant="outline" onClick={copy} flexShrink={0}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          <span aria-live="polite">{copied ? copiedLabel : copyLabel}</span>
        </Button>
      </HStack>
    </Box>
  );
}
