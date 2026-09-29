import { Box, HStack, Text } from "@chakra-ui/react";
import { Home } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { BrandLogoProps } from "./BrandLogo.types";

export function BrandLogo({ href = "/" }: BrandLogoProps) {
  return (
    <HStack asChild gap={2}>
      <Link href={href}>
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
  );
}
