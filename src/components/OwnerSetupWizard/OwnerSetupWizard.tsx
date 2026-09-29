"use client";

import { Box, Button, Field, Heading, HStack, IconButton, Input, SimpleGrid, Text, VStack } from "@chakra-ui/react";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { type FormEvent, useRef, useState } from "react";
import { CurrencyInput } from "@/components/CurrencyInput";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { Link, useRouter } from "@/i18n/navigation";
import { ApiError, apiJson } from "@/lib/api-client";
import type { CreateKosBody, KosSummaryDto } from "@/lib/api-types";
import { formatIdr } from "@/lib/format";
import { useSession } from "@/lib/session";
import { useApiErrorMessage } from "@/lib/useApiErrorMessage";
import type { OwnerSetupWizardProps } from "./OwnerSetupWizard.types";

const MAX_ROOMS = 200;
const MIN_RENT = 50_000;
const MAX_RENT = 100_000_000;

interface RoomRow {
  key: number;
  name: string;
  monthlyRent: number | null;
}

type Errors = Partial<Record<"name" | "address" | "city" | "count" | "start" | "rent" | "rooms", string>>;

const validRent = (rent: number | null): rent is number => rent !== null && rent >= MIN_RENT && rent <= MAX_RENT;

export function OwnerSetupWizard({ mode, me, onCreated }: OwnerSetupWizardProps) {
  const t = useTranslations("ownerSetup");
  const router = useRouter();
  const { refresh } = useSession();
  const errorMessage = useApiErrorMessage();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [count, setCount] = useState("10");
  const [start, setStart] = useState("1");
  const [prefix, setPrefix] = useState(t("rooms.defaultPrefix"));
  const [defaultRent, setDefaultRent] = useState<number | null>(null);
  const [rows, setRows] = useState<RoomRow[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState<KosSummaryDto | null>(null);
  const [gate, setGate] = useState(false);
  const nextKey = useRef(1);

  const gated = gate || (mode === "add" && !me.canAddKos);
  if (gated) return <UpgradePrompt reason="limit" backHref={mode === "add" ? "/app" : "/join"} />;

  function clearError(field: keyof Errors) {
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  }

  function validateKos(): boolean {
    const next: Errors = {};
    const trimmed = name.trim();
    if (!trimmed) next.name = t("errors.nameRequired");
    else if (trimmed.length < 2) next.name = t("errors.nameTooShort");
    else if (trimmed.length > 60) next.name = t("errors.nameTooLong");
    if (!address.trim()) next.address = t("errors.addressRequired");
    if (!city.trim()) next.city = t("errors.cityRequired");
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function goToRooms(event: FormEvent) {
    event.preventDefault();
    if (validateKos()) setStep(2);
  }

  const roomName = (number: number) => `${prefix.trim()} ${number}`.trim();

  function generate() {
    const next: Errors = {};
    const total = Number(count);
    const first = Number(start);
    if (!/^\d+$/.test(count) || total < 1 || total > MAX_ROOMS) next.count = t("errors.countRange", { max: MAX_ROOMS });
    if (!/^\d+$/.test(start)) next.start = t("errors.startInvalid");
    if (!validRent(defaultRent)) next.rent = t("errors.rentRange", { min: formatIdr(MIN_RENT), max: formatIdr(MAX_RENT) });
    setErrors((previous) => ({ ...previous, count: next.count, start: next.start, rent: next.rent, rooms: undefined }));
    if (next.count || next.start || next.rent) return;
    setRows(Array.from({ length: total }, (_, index) => ({ key: nextKey.current++, name: roomName(first + index), monthlyRent: defaultRent })));
  }

  function addRoom() {
    setRows((previous) => {
      const used = new Set(previous.map((row) => row.name.toLowerCase()));
      let number = Number(start) || 1;
      while (used.has(roomName(number).toLowerCase())) number += 1;
      return [...previous, { key: nextKey.current++, name: roomName(number), monthlyRent: defaultRent }];
    });
    clearError("rooms");
  }

  function setRent(key: number, monthlyRent: number | null) {
    setRows((previous) => previous.map((row) => (row.key === key ? { ...row, monthlyRent } : row)));
    clearError("rooms");
  }

  async function createKos() {
    if (rows.length === 0) return setErrors({ rooms: t("errors.roomsRequired") });
    if (rows.some((row) => !validRent(row.monthlyRent))) {
      return setErrors({ rooms: t("errors.rentRange", { min: formatIdr(MIN_RENT), max: formatIdr(MAX_RENT) }) });
    }
    setErrors({});
    setSubmitError(null);
    setBusy(true);
    try {
      const body: CreateKosBody = {
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        rooms: rows.map((row) => ({ name: row.name, monthlyRent: row.monthlyRent as number })),
      };
      const kos = await apiJson<KosSummaryDto>("/api/v1/kos", { body });
      onCreated?.();
      await refresh();
      setCreated(kos);
      setStep(3);
    } catch (error) {
      if (error instanceof ApiError && error.code === "plan_limit_reached") setGate(true);
      else setSubmitError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  const totalRent = rows.reduce((sum, row) => sum + (row.monthlyRent ?? 0), 0);

  if (step === 3 && created) {
    return (
      <VStack gap={4} textAlign="center" bg="white" borderRadius="2xl" boxShadow="card" p={{ base: 6, md: 10 }}>
        <Box w={14} h={14} borderRadius="full" bg="primary.solid" color="white" display="flex" alignItems="center" justifyContent="center">
          <CheckCircle2 size={28} />
        </Box>
        <Heading as="h1" fontFamily="heading" fontWeight="800" fontSize="2xl" color="gray.900">
          {t("done.title", { kos: created.name })}
        </Heading>
        <Text color="gray.700" maxW="md">
          {t("done.body", { count: created.totalRooms })}
        </Text>
        <Button type="button" colorPalette="primary" size="lg" minH="14" borderRadius="full" px={8} onClick={() => router.replace(`/app/k/${created.id}`)}>
          {t("done.cta")}
        </Button>
      </VStack>
    );
  }

  return (
    <Box>
      <VStack gap={2} textAlign="center" mb={6}>
        <HStack gap={2} aria-hidden="true">
          {[1, 2].map((index) => (
            <Box key={index} h={1.5} w={12} borderRadius="full" bg={index <= step ? "primary.emphasized" : "gray.200"} />
          ))}
        </HStack>
        <Text fontSize="xs" fontWeight="700" color="gray.700" textTransform="uppercase" letterSpacing="wide">
          {t("stepOf", { step, total: 2 })}
        </Text>
        <Heading as="h1" fontFamily="heading" fontWeight="800" fontSize={{ base: "3xl", md: "4xl" }} color="gray.900">
          {step === 1 ? t("step1.headline") : t("step2.headline")}
        </Heading>
        <Text fontSize={{ base: "md", md: "lg" }} color="gray.700">
          {step === 1 ? t("step1.subheadline") : t("step2.subheadline")}
        </Text>
      </VStack>

      <Box bg="white" borderRadius="2xl" boxShadow="card" p={{ base: 6, md: 8 }}>
        {step === 1 && (
          <form onSubmit={goToRooms} noValidate>
            <VStack align="stretch" gap={5}>
              <Field.Root invalid={!!errors.name} required>
                <Field.Label>
                  {t("step1.nameLabel")}
                  <Field.RequiredIndicator />
                </Field.Label>
                <Input value={name} onChange={(e) => { setName(e.target.value); clearError("name"); }} placeholder={t("step1.namePlaceholder")} size="lg" borderRadius="xl" autoComplete="off" />
                <Field.ErrorText>{errors.name}</Field.ErrorText>
              </Field.Root>
              <Field.Root invalid={!!errors.address} required>
                <Field.Label>
                  {t("step1.addressLabel")}
                  <Field.RequiredIndicator />
                </Field.Label>
                <Input value={address} onChange={(e) => { setAddress(e.target.value); clearError("address"); }} placeholder={t("step1.addressPlaceholder")} size="lg" borderRadius="xl" autoComplete="street-address" />
                <Field.ErrorText>{errors.address}</Field.ErrorText>
              </Field.Root>
              <Field.Root invalid={!!errors.city} required>
                <Field.Label>
                  {t("step1.cityLabel")}
                  <Field.RequiredIndicator />
                </Field.Label>
                <Input value={city} onChange={(e) => { setCity(e.target.value); clearError("city"); }} placeholder={t("step1.cityPlaceholder")} size="lg" borderRadius="xl" autoComplete="address-level2" />
                <Field.ErrorText>{errors.city}</Field.ErrorText>
              </Field.Root>
              <Button type="submit" colorPalette="primary" size="lg" minH="14" borderRadius="full">
                {t("continue")}
              </Button>
              {mode === "first" ? (
                <Button asChild variant="ghost" minH="10">
                  <Link href="/join">{t("notOwner")}</Link>
                </Button>
              ) : (
                <Button asChild variant="ghost" minH="10">
                  <Link href="/app">{t("cancel")}</Link>
                </Button>
              )}
            </VStack>
          </form>
        )}

        {step === 2 && (
          <VStack align="stretch" gap={6}>
            <Box>
              <Text fontWeight="700" color="gray.900" mb={1}>
                {t("step2.generatorTitle")}
              </Text>
              <Text fontSize="sm" color="gray.700" mb={4}>
                {t("step2.generatorHelp")}
              </Text>
              <SimpleGrid columns={{ base: 1, sm: 3 }} gap={4}>
                <Field.Root invalid={!!errors.count}>
                  <Field.Label>{t("step2.countLabel")}</Field.Label>
                  <Input inputMode="numeric" value={count} onChange={(e) => { setCount(e.target.value.replace(/\D/g, "")); clearError("count"); }} size="lg" borderRadius="xl" />
                  <Field.ErrorText>{errors.count}</Field.ErrorText>
                </Field.Root>
                <Field.Root>
                  <Field.Label>{t("step2.prefixLabel")}</Field.Label>
                  <Input value={prefix} onChange={(e) => setPrefix(e.target.value)} size="lg" borderRadius="xl" />
                </Field.Root>
                <Field.Root invalid={!!errors.start}>
                  <Field.Label>{t("step2.startLabel")}</Field.Label>
                  <Input inputMode="numeric" value={start} onChange={(e) => { setStart(e.target.value.replace(/\D/g, "")); clearError("start"); }} size="lg" borderRadius="xl" />
                  <Field.ErrorText>{errors.start}</Field.ErrorText>
                </Field.Root>
              </SimpleGrid>
              <Field.Root invalid={!!errors.rent} mt={4}>
                <Field.Label>{t("step2.rentLabel")}</Field.Label>
                <CurrencyInput value={defaultRent} onChange={(value) => { setDefaultRent(value); clearError("rent"); }} invalid={!!errors.rent} placeholder="850.000" />
                {errors.rent ? <Field.ErrorText>{errors.rent}</Field.ErrorText> : <Field.HelperText>{t("step2.rentHelp")}</Field.HelperText>}
              </Field.Root>
              <Button type="button" variant="outline" colorPalette="primary" minH="12" borderRadius="full" mt={4} onClick={generate}>
                {rows.length > 0 ? t("step2.regenerate") : t("step2.generate")}
              </Button>
            </Box>

            {rows.length > 0 && (
              <Box>
                <HStack justify="space-between" mb={3}>
                  <Text fontWeight="700" color="gray.900">
                    {t("step2.listTitle", { count: rows.length })}
                  </Text>
                  <Text fontSize="sm" color="gray.700" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {t("step2.total", { amount: formatIdr(totalRent) })}
                  </Text>
                </HStack>
                <VStack align="stretch" gap={2} maxH="80" overflowY="auto" pr={1} role="list">
                  {rows.map((row) => (
                    <HStack key={row.key} gap={3} bg="gray.50" borderRadius="xl" p={2} pl={4} role="listitem">
                      <Text fontWeight="600" color="gray.900" flex="1" minW={0} truncate>
                        {row.name}
                      </Text>
                      <Box w={{ base: "40", sm: "52" }}>
                        <CurrencyInput size="md" value={row.monthlyRent} onChange={(value) => setRent(row.key, value)} invalid={!validRent(row.monthlyRent)} aria-label={t("step2.rentFor", { room: row.name })} />
                      </Box>
                      <IconButton
                        type="button"
                        variant="ghost"
                        size="sm"
                        minW="10"
                        minH="10"
                        aria-label={t("step2.removeRoom", { room: row.name })}
                        onClick={() => setRows((previous) => previous.filter((item) => item.key !== row.key))}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </HStack>
                  ))}
                </VStack>
                <Button type="button" variant="ghost" colorPalette="primary" minH="10" mt={2} onClick={addRoom} disabled={rows.length >= MAX_ROOMS}>
                  <Plus size={16} />
                  {t("step2.addRoom")}
                </Button>
              </Box>
            )}

            {errors.rooms && (
              <Text color="critical.fg" fontSize="sm" fontWeight="600" role="alert">
                {errors.rooms}
              </Text>
            )}
            {submitError && (
              <Text color="critical.fg" fontSize="sm" fontWeight="600" role="alert">
                {submitError}
              </Text>
            )}

            <VStack align="stretch" gap={2}>
              <Button type="button" colorPalette="primary" size="lg" minH="14" borderRadius="full" loading={busy} loadingText={t("creating")} disabled={rows.length === 0} onClick={() => void createKos()}>
                {t("create")}
              </Button>
              <Button type="button" variant="ghost" minH="10" disabled={busy} onClick={() => setStep(1)}>
                {t("back")}
              </Button>
            </VStack>
          </VStack>
        )}
      </Box>
    </Box>
  );
}
