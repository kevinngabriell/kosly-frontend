"use client";

import { Box } from "@chakra-ui/react";
import { OwnerSetupWizard } from "@/components/OwnerSetupWizard";
import { useMe } from "@/lib/session";

/** Adding another kos from inside the app: the same setup as first-time onboarding, behind the plan gate. */
export function NewKosView() {
  const me = useMe();
  return (
    <Box maxW="2xl" mx="auto">
      <OwnerSetupWizard mode="add" me={me} />
    </Box>
  );
}
