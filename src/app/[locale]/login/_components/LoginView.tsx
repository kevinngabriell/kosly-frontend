"use client";

import {
  Box,
  Button,
  Checkbox,
  Container,
  Field,
  Heading,
  HStack,
  IconButton,
  Input,
  InputGroup,
  Text,
  VStack,
} from "@chakra-ui/react";
import { CheckCircle2, Eye, EyeOff, Home } from "lucide-react";
import { useTranslations } from "next-intl";
import { type FormEvent, useEffect, useState } from "react";
import { Blob } from "@/components/Blob";
import { Link, useRouter } from "@/i18n/navigation";
import { apiFetch } from "@/lib/api-client";

type FormValues = {
  email: string;
  password: string;
  rememberMe: boolean;
};

type FormErrors = Partial<Record<"email" | "password", string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INITIAL_VALUES: FormValues = { email: "", password: "", rememberMe: false };

export function LoginView() {
  const t = useTranslations("login");
  const tNav = useTranslations("landing.nav");
  const router = useRouter();

  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  useEffect(() => {
    if (status !== "success") return;
    const timeout = setTimeout(() => router.push("/"), 1200);
    return () => clearTimeout(timeout);
  }, [status, router]);

  function updateField<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (field === "email" || field === "password") {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function validate(current: FormValues): FormErrors {
    const nextErrors: FormErrors = {};
    if (!current.email.trim()) nextErrors.email = t("errors.emailRequired");
    else if (!EMAIL_PATTERN.test(current.email)) nextErrors.email = t("errors.emailInvalid");
    if (!current.password) nextErrors.password = t("errors.passwordRequired");
    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("submitting");
    try {
      const res = await apiFetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email.trim(),
          password: values.password,
          rememberMe: values.rememberMe,
        }),
      });
      if (!res.ok) throw new Error("Login failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <Box position="relative" overflow="hidden" minH="100vh" bg="primary.subtle">
      <Blob color="secondary.100" size="300px" top="-80px" left="-60px" opacity={0.8} rotate={-10} />
      <Blob color="accent.200" size="200px" bottom="-50px" right="-50px" opacity={0.75} rotate={14} />

      <Box as="header" position="relative" zIndex={1}>
        <Container maxW="7xl" py={3}>
          <HStack justify="space-between" gap={4}>
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

            <HStack gap={3}>
              <Text fontSize="sm" color="gray.700" display={{ base: "none", sm: "block" }}>
                {t("registerPrompt")}
              </Text>
              <Button asChild variant="outline" colorPalette="primary" size="sm" minH="10" borderRadius="full" bg="white">
                <Link href="/register">{tNav("register")}</Link>
              </Button>
            </HStack>
          </HStack>
        </Container>
      </Box>

      <Container maxW="md" position="relative" zIndex={1} pb={{ base: 12, md: 20 }} pt={{ base: 8, md: 14 }}>
        <VStack gap={2} textAlign="center" mb={8}>
          <HStack bg="white" display="inline-flex" px={3} py={1.5} borderRadius="full" boxShadow="card" gap={2}>
            <Box w={2} h={2} borderRadius="full" bg="primary.emphasized" />
            <Text fontSize="xs" fontWeight="700" color="gray.700" textTransform="uppercase" letterSpacing="wide">
              {t("eyebrow")}
            </Text>
          </HStack>
          <Heading as="h1" fontFamily="heading" fontWeight="800" fontSize={{ base: "3xl", md: "4xl" }} color="gray.900">
            {t("headline")}
          </Heading>
          <Text fontSize={{ base: "md", md: "lg" }} color="gray.700">
            {t("subheadline")}
          </Text>
        </VStack>

        <Box bg="white" borderRadius="2xl" boxShadow="card" p={{ base: 6, md: 8 }}>
          {status === "success" ? (
            <VStack gap={3} textAlign="center" py={4}>
              <Box
                w={14}
                h={14}
                borderRadius="full"
                bg="primary.solid"
                color="white"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <CheckCircle2 size={26} />
              </Box>
              <Text color="gray.700" fontWeight="600">
                {t("successMessage")}
              </Text>
            </VStack>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <VStack align="stretch" gap={5}>
                <Field.Root invalid={!!errors.email} required>
                  <Field.Label>
                    {t("emailLabel")}
                    <Field.RequiredIndicator />
                  </Field.Label>
                  <Input
                    type="email"
                    value={values.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder={t("emailPlaceholder")}
                    size="lg"
                    borderRadius="xl"
                    autoComplete="email"
                  />
                  <Field.ErrorText>{errors.email}</Field.ErrorText>
                </Field.Root>

                <Field.Root invalid={!!errors.password} required>
                  <Field.Label>
                    {t("passwordLabel")}
                    <Field.RequiredIndicator />
                  </Field.Label>
                  <InputGroup
                    endElement={
                      <IconButton
                        aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                        type="button"
                        variant="ghost"
                        size="sm"
                        minW="10"
                        minH="10"
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </IconButton>
                    }
                  >
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={values.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      placeholder={t("passwordPlaceholder")}
                      size="lg"
                      borderRadius="xl"
                      autoComplete="current-password"
                    />
                  </InputGroup>
                  <Field.ErrorText>{errors.password}</Field.ErrorText>
                </Field.Root>

                <Checkbox.Root
                  checked={values.rememberMe}
                  onCheckedChange={(details) => updateField("rememberMe", !!details.checked)}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                  <Checkbox.Label fontWeight="400" color="gray.700">
                    {t("rememberMe")}
                  </Checkbox.Label>
                </Checkbox.Root>

                {status === "error" && (
                  <Text color="critical.fg" fontSize="sm" fontWeight="600">
                    {t("errors.generic")}
                  </Text>
                )}

                <Button
                  type="submit"
                  colorPalette="primary"
                  size="lg"
                  minH="14"
                  borderRadius="full"
                  loading={status === "submitting"}
                  loadingText={t("submitButtonLoading")}
                  _hover={{ transform: "translateY(-2px)", boxShadow: "cardHover" }}
                  transition="transform 0.15s ease, box-shadow 0.15s ease"
                >
                  {t("submitButton")}
                </Button>
              </VStack>
            </form>
          )}
        </Box>
      </Container>
    </Box>
  );
}
