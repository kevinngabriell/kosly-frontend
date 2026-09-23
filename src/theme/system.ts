import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  globalCss: {
    html: {
      colorPalette: "primary", // unstyled Buttons/Badges/etc. default to Kosly coral, not Chakra blue
    },
    body: {
      bg: "gray.50",
    },
  },
  theme: {
    tokens: {
      colors: {
        // Brand — "Kosly Coral". Flagship shade is 500, buttons/solid text use 700 — see design doc §4.
        primary: {
          50: { value: "#FFF3F1" },
          100: { value: "#FFE3DF" },
          200: { value: "#FFC9C2" },
          300: { value: "#FFA79C" },
          400: { value: "#FF8A7A" },
          500: { value: "#FF6B6B" }, // ← flagship "Kosly Coral" — for owners
          600: { value: "#F14848" },
          700: { value: "#D62F2F" }, // white-text-safe (§4.6)
          800: { value: "#A82323" },
          900: { value: "#7A1919" },
        },
        // Secondary brand — "Kos Teal", the penghuni (resident) pillar color.
        secondary: {
          50: { value: "#EFFBFA" },
          100: { value: "#D7F5F2" },
          200: { value: "#AEEBE4" },
          300: { value: "#7EDDD3" },
          400: { value: "#5CD2C7" },
          500: { value: "#4ECDC4" }, // ← flagship "Kos Teal" — for penghuni
          600: { value: "#2FA89E" },
          700: { value: "#1F7A72" }, // white-text-safe (§4.6)
          800: { value: "#175C56" },
          900: { value: "#0F3D39" },
        },
        // Accent — "Sunshine", the penjaga (caretaker) pillar color + decorative highlight.
        accent: {
          50: { value: "#FFFBF0" },
          100: { value: "#FFF4D6" },
          200: { value: "#FFE8AD" },
          300: { value: "#FFDD89" },
          400: { value: "#FFD673" },
          500: { value: "#FFD166" }, // ← flagship "Sunshine" — for penjaga, decorative only
          600: { value: "#F2B93D" },
          700: { value: "#D99A1F" }, // dark-text-on-white-safe; NOT white-text-safe, see §4.6
          800: { value: "#A9760F" },
          900: { value: "#7A560A" },
        },
        // Alert — "Rose", distinct hue from primary so alerts never read as "brand".
        critical: {
          50: { value: "#FFF0F4" },
          100: { value: "#FFDCE6" },
          200: { value: "#FFB8CE" },
          300: { value: "#FF8FB0" },
          400: { value: "#F76394" },
          500: { value: "#EF476F" },
          600: { value: "#D42A56" },
          700: { value: "#AD1F45" }, // white-text-safe (§4.6)
          800: { value: "#7D1732" },
          900: { value: "#4F0F20" },
        },
        // Override Chakra's built-in gray with a warm sand-tinted neutral so every
        // default surface/border in the framework feels cozy, not clinical.
        gray: {
          50: { value: "#FBFAF9" },
          100: { value: "#F5F2EF" },
          200: { value: "#E9E3DC" },
          300: { value: "#D6CDC2" },
          400: { value: "#B3A89A" },
          500: { value: "#8C8073" },
          600: { value: "#6B6156" },
          700: { value: "#4F473F" },
          800: { value: "#342E29" },
          900: { value: "#211D19" },
        },
      },
      fonts: {
        heading: { value: "var(--font-heading), sans-serif" },
        body: { value: "var(--font-body), sans-serif" },
      },
      shadows: {
        card: { value: "0 4px 16px -4px rgba(33, 24, 20, 0.08)" },
        cardHover: { value: "0 16px 32px -12px rgba(33, 24, 20, 0.18)" },
        glow: { value: "0 10px 28px -8px rgba(255, 107, 107, 0.4)" },
      },
    },
    semanticTokens: {
      colors: {
        primary: {
          solid: { value: "{colors.primary.700}" }, // buttons, nav, primary CTAs — white-text-safe
          contrast: { value: "white" },
          fg: { value: "{colors.primary.700}" }, // text-on-light
          muted: { value: "{colors.primary.100}" },
          subtle: { value: "{colors.primary.50}" },
          emphasized: { value: "{colors.primary.400}" }, // vibrant flagship coral for icon tiles/decoration
          focusRing: { value: "{colors.primary.500}" },
        },
        secondary: {
          solid: { value: "{colors.secondary.700}" }, // white-text-safe
          contrast: { value: "white" },
          fg: { value: "{colors.secondary.700}" },
          muted: { value: "{colors.secondary.100}" },
          subtle: { value: "{colors.secondary.50}" },
          emphasized: { value: "{colors.secondary.400}" },
          focusRing: { value: "{colors.secondary.500}" },
        },
        accent: {
          solid: { value: "{colors.accent.500}" }, // NOT white-text-safe — pair with contrast below
          contrast: { value: "{colors.gray.900}" }, // dark ink text on sunshine yellow
          fg: { value: "{colors.accent.700}" }, // text-on-white use (links, labels)
          muted: { value: "{colors.accent.100}" },
          subtle: { value: "{colors.accent.50}" },
          emphasized: { value: "{colors.accent.400}" },
          focusRing: { value: "{colors.accent.600}" },
        },
        critical: {
          solid: { value: "{colors.critical.700}" }, // white-text-safe
          contrast: { value: "white" },
          fg: { value: "{colors.critical.700}" },
          muted: { value: "{colors.critical.100}" },
          subtle: { value: "{colors.critical.50}" },
          emphasized: { value: "{colors.critical.400}" },
          focusRing: { value: "{colors.critical.500}" },
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
