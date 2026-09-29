"use client";

import { Box } from "@chakra-ui/react";
import { UpgradePrompt } from "@/components/UpgradePrompt";

export function UpgradeView() {
  return (
    <Box maxW="xl" mx="auto">
      <UpgradePrompt reason="readOnly" backHref="/app" />
    </Box>
  );
}
