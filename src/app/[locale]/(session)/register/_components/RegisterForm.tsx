"use client";

import {
  Box,
  Button,
  Checkbox,
  Field,
  Heading,
  IconButton,
  Input,
  InputGroup,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { Link } from "@/i18n/navigation";
import { apiFetch } from "@/lib/api-client";
import { ROLE_PALETTE, type Role } from "./register.types";

type FormValues = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\s-]{8,15}$/;

const INITIAL_VALUES: FormValues = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  agreeTerms: false,
};

export function RegisterForm({ role }: { role: Role }) {
  const t = useTranslations("register");
  const palette = ROLE_PALETTE[role];

  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  function updateField<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate(current: FormValues): FormErrors {
    const nextErrors: FormErrors = {};
    if (!current.fullName.trim()) nextErrors.fullName = t("errors.fullNameRequired");
    if (!current.email.trim()) nextErrors.email = t("errors.emailRequired");
    else if (!EMAIL_PATTERN.test(current.email)) nextErrors.email = t("errors.emailInvalid");
    if (current.phone.trim() && !PHONE_PATTERN.test(current.phone)) nextErrors.phone = t("errors.phoneInvalid");
    if (current.password.length < 8) nextErrors.password = t("errors.passwordTooShort");
    if (current.confirmPassword !== current.password) nextErrors.confirmPassword = t("errors.passwordMismatch");
    if (!current.agreeTerms) nextErrors.agreeTerms = t("errors.termsRequired");
    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("submitting");
    try {
      const res = await apiFetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: values.fullName.trim(),
          email: values.email.trim(),
          phone: values.phone.trim() || undefined,
          password: values.password,
          role,
        }),
      });
      if (!res.ok) throw new Error("Registration failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <VStack gap={4} textAlign="center" py={6}>
        <Box
          w={14}
          h={14}
          borderRadius="full"
          bg={`${palette}.solid`}
          color="white"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <CheckCircle2 size={28} />
        </Box>
        <Heading as="h2" fontFamily="heading" fontWeight="700" fontSize="xl" color="gray.900">
          {t("successHeadline")}
        </Heading>
        <Text color="gray.700">{t("successBody")}</Text>
        <Button asChild colorPalette={palette} borderRadius="full" minH="12" px={8}>
          <Link href="/login">{t("loginLink")}</Link>
        </Button>
      </VStack>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <VStack align="stretch" gap={5} colorPalette={palette}>
        <Field.Root invalid={!!errors.fullName} required>
          <Field.Label>
            {t("fullNameLabel")}
            <Field.RequiredIndicator />
          </Field.Label>
          <Input
            value={values.fullName}
            onChange={(e) => updateField("fullName", e.target.value)}
            placeholder={t("fullNamePlaceholder")}
            size="lg"
            borderRadius="xl"
            autoComplete="name"
          />
          <Field.ErrorText>{errors.fullName}</Field.ErrorText>
        </Field.Root>

        <SimpleGrid columns={{ base: 1, sm: 2 }} gap={5}>
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

          <Field.Root invalid={!!errors.phone}>
            <Field.Label>{t("phoneLabel")}</Field.Label>
            <Input
              type="tel"
              value={values.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder={t("phonePlaceholder")}
              size="lg"
              borderRadius="xl"
              autoComplete="tel"
            />
            <Field.ErrorText>{errors.phone}</Field.ErrorText>
          </Field.Root>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, sm: 2 }} gap={5}>
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
                autoComplete="new-password"
              />
            </InputGroup>
            {errors.password ? (
              <Field.ErrorText>{errors.password}</Field.ErrorText>
            ) : (
              <Field.HelperText>{t("passwordHelper")}</Field.HelperText>
            )}
          </Field.Root>

          <Field.Root invalid={!!errors.confirmPassword} required>
            <Field.Label>
              {t("confirmPasswordLabel")}
              <Field.RequiredIndicator />
            </Field.Label>
            <InputGroup
              endElement={
                <IconButton
                  aria-label={showConfirmPassword ? t("hidePassword") : t("showPassword")}
                  type="button"
                  variant="ghost"
                  size="sm"
                  minW="10"
                  minH="10"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </IconButton>
              }
            >
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={values.confirmPassword}
                onChange={(e) => updateField("confirmPassword", e.target.value)}
                placeholder={t("confirmPasswordPlaceholder")}
                size="lg"
                borderRadius="xl"
                autoComplete="new-password"
              />
            </InputGroup>
            <Field.ErrorText>{errors.confirmPassword}</Field.ErrorText>
          </Field.Root>
        </SimpleGrid>

        <Field.Root invalid={!!errors.agreeTerms}>
          <Checkbox.Root
            checked={values.agreeTerms}
            onCheckedChange={(details) => updateField("agreeTerms", !!details.checked)}
            alignItems="flex-start"
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control mt={0.5} />
            <Checkbox.Label fontWeight="400" color="gray.700" lineHeight="1.5">
              {t("termsPrefix")}{" "}
              <Box asChild display="inline" color={`${palette}.fg`} fontWeight="600" textDecoration="underline">
                <Link href="/terms">{t("termsLink")}</Link>
              </Box>{" "}
              {t("andLabel")}{" "}
              <Box asChild display="inline" color={`${palette}.fg`} fontWeight="600" textDecoration="underline">
                <Link href="/privacy">{t("privacyLink")}</Link>
              </Box>
            </Checkbox.Label>
          </Checkbox.Root>
          <Field.ErrorText>{errors.agreeTerms}</Field.ErrorText>
        </Field.Root>

        {status === "error" && (
          <Text color="critical.fg" fontSize="sm" fontWeight="600">
            {t("errors.generic")}
          </Text>
        )}

        <Button
          type="submit"
          colorPalette={palette}
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
  );
}
