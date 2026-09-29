import { Box, Button, Heading, Spinner, Text, VStack } from "@chakra-ui/react";
import { AlertTriangle, SearchX } from "lucide-react";
import type { StatusViewProps } from "./StatusView.types";

export function StatusView({ kind, title, body, retryLabel, onRetry, action, fullPage }: StatusViewProps) {
  return (
    <VStack
      gap={3}
      textAlign="center"
      justify="center"
      minH={fullPage ? "100vh" : "40vh"}
      px={6}
      py={10}
      role={kind === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      {kind === "loading" ? (
        <Spinner size="lg" color="primary.solid" borderWidth="3px" />
      ) : (
        <Box
          w={14}
          h={14}
          borderRadius="full"
          bg={kind === "error" ? "critical.subtle" : "gray.100"}
          color={kind === "error" ? "critical.fg" : "gray.600"}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          {kind === "error" ? <AlertTriangle size={26} /> : <SearchX size={26} />}
        </Box>
      )}
      {title && (
        <Heading as="h2" fontFamily="heading" fontWeight="700" fontSize="xl" color="gray.900">
          {title}
        </Heading>
      )}
      {body && (
        <Text color="gray.700" maxW="sm">
          {body}
        </Text>
      )}
      {onRetry && retryLabel && (
        <Button type="button" colorPalette="primary" borderRadius="full" minH="10" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
      {action}
    </VStack>
  );
}
