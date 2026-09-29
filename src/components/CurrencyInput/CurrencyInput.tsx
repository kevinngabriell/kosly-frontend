"use client";

import { Input, InputGroup, Text } from "@chakra-ui/react";
import { formatIdrDigits } from "@/lib/format";
import type { CurrencyInputProps } from "./CurrencyInput.types";

// 12 digits keeps every value well inside Number.MAX_SAFE_INTEGER.
const MAX_DIGITS = 12;

/** Rupiah amount field: digits only, shown with Indonesian thousands separators as you type. */
export function CurrencyInput({
  value,
  onChange,
  id,
  invalid,
  placeholder,
  "aria-label": ariaLabel,
  size = "lg",
}: CurrencyInputProps) {
  return (
    <InputGroup
      startElement={
        <Text fontWeight="600" color="gray.600" aria-hidden="true">
          Rp
        </Text>
      }
    >
      <Input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        size={size}
        borderRadius="xl"
        aria-invalid={invalid || undefined}
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={value === null ? "" : formatIdrDigits(value)}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "").slice(0, MAX_DIGITS);
          onChange(digits ? Number(digits) : null);
        }}
      />
    </InputGroup>
  );
}
