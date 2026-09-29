"use client";

import { PinInput } from "@chakra-ui/react";
import type { OtpInputProps } from "./OtpInput.types";

const LENGTH = 6;

/** Six single-digit boxes with paste, auto-advance and the platform's one-time-code autofill. */
export function OtpInput({
  value,
  onChange,
  onComplete,
  invalid,
  disabled,
  autoFocus,
  "aria-label": ariaLabel,
}: OtpInputProps) {
  const chars = Array.from({ length: LENGTH }, (_, index) => value[index] ?? "");

  return (
    <PinInput.Root
      count={LENGTH}
      otp
      type="numeric"
      size="xl"
      value={chars}
      invalid={invalid}
      disabled={disabled}
      autoFocus={autoFocus}
      aria-label={ariaLabel}
      onValueChange={(details) => onChange(details.valueAsString)}
      onValueComplete={(details) => onComplete?.(details.valueAsString)}
    >
      <PinInput.HiddenInput />
      <PinInput.Control display="flex" gap={{ base: 2, sm: 3 }} justifyContent="center">
        {chars.map((_, index) => (
          <PinInput.Input key={index} index={index} borderRadius="xl" />
        ))}
      </PinInput.Control>
    </PinInput.Root>
  );
}
