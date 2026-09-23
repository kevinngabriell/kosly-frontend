# Kosly Design System — Frontend Agent Instructions

*Prepared as a business-analyst design brief, for direct use by the frontend build agent.*
*Stack: Next.js + Chakra UI v3 · v2.0 · September 2026*

---

## 0. Why this system looks the way it does

**v2.0 supersedes v1.0's "Ledger Navy" system.** v1.0 was built entirely around one story: an owner who can't be on-site, trusting a report from someone else. Every decision — navy palette, mono ledger numerals, dashed/solid verification borders, "no playful depth" — served that single audience, and it made the product read like a bank statement.

But most people who open Kosly on a given day are not auditing anything. They're a **penghuni** paying rent and wanting a receipt, or a **penjaga** logging today's cash between other chores. The owner is real and still matters, but a UI that only speaks to a remote auditor is flat and unwelcoming to the other two-thirds of its users. v2.0's job is to feel like a **helpful, trustworthy companion for all three people around one kos** — not a ledger for one of them.

Concretely, that shows up as:

- A warm, colorful, rounded visual language instead of a navy register — this is still a product about money and trust, but trust is now carried by clear copy, icons, and consistency, not by an austere aesthetic.
- **Three equal, color-coded pillars** — owner (coral), penghuni/resident (teal), penjaga/caretaker (amber) — used consistently across nav, `HowItWorks`, and any future role-specific UI, so each audience visually recognizes "this part is for me."
- The literal ledger motif (monospace financial figures, dashed/solid verification borders, the "stamp" chip) is retired. Trust is now communicated through plain copy ("logged automatically, never rewritten"), icons, and normal typography — not through a signature financial-register aesthetic.

---

## 1. Ground rules (non-negotiable)

1. **Chakra UI is the only component system.** No raw unstyled `<div>` soup for anything Chakra already provides, no second component library, no ad hoc Tailwind utility classes bolted on top. If Chakra doesn't have a primitive for something, compose Chakra primitives (see §8) — don't reach for another kit.
2. **Chakra UI v3** (`createSystem` / `defineConfig`), not the old v2 `extendTheme` API.
3. **No inline hex codes in components.** Every color reference goes through a theme token (`primary.700`, `secondary.500`, `accent.500`, `critical.700`, `gray.200`, etc.). Shadow colors go through the `card`/`cardHover`/`glow` shadow tokens for the same reason — don't hand-roll `rgba(...)` box-shadows in a component. If a token doesn't exist for a case you hit, add it to the theme file — don't improvise a one-off hex.
4. **No mandatory mono/financial-figure styling.** Currency figures render in the normal heading/body font, bold for emphasis, with `fontVariantNumeric: "tabular-nums"` for alignment quality where several amounts stack (that's a numeric-alignment feature, not a "ledger" aesthetic — keep using it, just not in a mono face).
5. **Polymorphism uses `asChild`, not `as={Component}`.** Chakra v3 components are fixed to their base HTML element in the type system; rendering a Chakra `Button`/`Text`/`HStack` as a link means `asChild` wrapping a single child element (`<Link>` or `<a>`), never `as={Link} href=...`. The latter compiles-looking but fails `next build`'s typecheck.
6. Every composite/interactive control that isn't a single Chakra import gets its own **component folder** (§8), even if it feels small at first.

---

## 2. Chakra UI setup

### 2.1 Theme file — `src/theme/system.ts`

```ts
import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  globalCss: {
    html: { colorPalette: "primary" }, // unstyled Buttons/Badges/etc. default to Kosly coral
    body: { bg: "gray.50" },
  },
  theme: {
    tokens: {
      colors: {
        primary: { /* Coral 50–900, flagship 500 = #FF6B6B, white-text-safe = 700 */ },
        secondary: { /* Teal 50–900, flagship 500 = #4ECDC4, white-text-safe = 700 */ },
        accent: { /* Sunshine 50–900, flagship 500 = #FFD166, never white-text-safe */ },
        critical: { /* Rose 50–900, flagship 500 = #EF476F, white-text-safe = 700 */ },
        gray: { /* warm "Sand" neutral, 50 (near-white) → 900 (warm near-black) */ },
      },
      fonts: {
        heading: { value: "var(--font-heading), sans-serif" }, // Baloo 2
        body: { value: "var(--font-body), sans-serif" },       // Inter
      },
      shadows: {
        card: { value: "0 4px 16px -4px rgba(33, 24, 20, 0.08)" },
        cardHover: { value: "0 16px 32px -12px rgba(33, 24, 20, 0.18)" },
        glow: { value: "0 10px 28px -8px rgba(255, 107, 107, 0.4)" },
      },
    },
    semanticTokens: { colors: { /* solid/contrast/fg/muted/subtle/emphasized/focusRing per palette — see §4.6 */ } },
  },
});

export const system = createSystem(defaultConfig, config);
```

See the actual file at `src/theme/system.ts` for full hex values — don't duplicate them by hand elsewhere; reference the tokens.

Wire it into the provider at `src/components/ui/provider.tsx` (already points at `@/theme/system`). Don't hand-edit other files under `components/ui/` — those are Chakra's own generated snippets; treat them as vendor code.

### 2.2 Fonts — `src/app/[locale]/layout.tsx`

```ts
import { Baloo_2, Inter } from "next/font/google";

const heading = Baloo_2({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-heading", display: "swap" });
const body    = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body", display: "swap" });
```

No mono font is loaded — the ledger-numeral rule from v1.0 is retired (§0, §5).

### 2.3 Icons

Use **`lucide-react`** exclusively. Don't mix in another icon set.

### 2.4 RSC boundary: never pass component references as props

When a server component (e.g. `HowItWorks.tsx`) builds data for a client component (e.g. `HowItWorksTabs.tsx`), never put a raw component reference (like a Lucide icon component) in that data — React Server Components can't serialize functions across the server→client boundary, and `next build` will fail the prerender with "Functions cannot be passed directly to Client Components." Render the icon into a JSX element in the server component instead (`icon: <Building2 size={22} />`) and type the receiving prop as `ReactNode`, not `LucideIcon`.

---

## 3. Color palette

| Token | Flagship shade | Hex | Role |
|---|---|---|---|
| `primary` — **Coral** | 500 / 700 | `#FF6B6B` / `#D62F2F` | Brand, nav, primary CTAs, **owner** pillar |
| `secondary` — **Teal** | 500 / 700 | `#4ECDC4` / `#1F7A72` | **Penghuni (resident)** pillar, secondary actions |
| `accent` — **Sunshine** | 500 | `#FFD166` | **Penjaga (caretaker)** pillar, decorative highlights only |
| `critical` — **Rose** | 500 / 700 | `#EF476F` / `#AD1F45` | Alerts, overdue, discrepancy — deliberately a different hue family from `primary` so alerts never read as "brand" |
| `gray` (overridden) — **Warm Sand** | — | `#FBFAF9 → #211D19` | Backgrounds, borders, body text |

### 4.1 The three-pillar color code

Owner, penghuni, and penjaga are **equal-weight audiences** (§0), and each gets a fixed color across the product:

- **Owner → `primary` (coral).** Also the default/unstyled brand color (nav, generic CTAs) since the owner was the original audience and coral is the flagship brand hue.
- **Penghuni / resident → `secondary` (teal).**
- **Penjaga / caretaker → `accent` (sunshine).**

Apply this consistently: a persona's icon tile, card top-border, badge, and tab all use that persona's palette (see `HowItWorksColumn` in §8). Don't reassign these per-page — a resident-facing screen elsewhere in the product should still read "teal" the same way.

### 4.2 Why warm and rounded, not navy and flat

A calm navy register communicated "trust" to one audience (the remote owner) at the cost of feeling like a bank statement to everyone else. Kosly is still a money product — payments, deposits, discrepancies are real stakes — but the emotional job of the landing/marketing surface is now "this is easy and made for people like you," with trust carried by clear copy and consistent iconography rather than by austerity. Don't over-correct into a marketplace-listing look either (no big product-photo grids, no marketplace badges) — the palette is playful, but the actual product surfaces (dashboards, transaction logs) should still read as competent, not toy-like.

### 4.3 Accent (Sunshine) is decoration + penjaga pillar only — never a solid white-text surface

`accent.500` fails white-text contrast by design (it's a bright yellow). Use it for: the penjaga pillar's icon tiles/badges/borders (paired with dark text/icons), decorative blobs, highlight chips. Never put white body text on `accent.solid` — use `accent.contrast` (which resolves to `gray.900`) instead.

### 4.4 Critical (Rose) — reserve for real alerts

Same discipline as v1.0's critical color: routine states (form validation, "payment due soon") use tints (`critical.100`–`critical.300`); confirmed discrepancies/overdue/fraud flags use full strength (`critical.500`+). Rose is a distinct hue from the coral brand color specifically so an alert never gets confused with a branded CTA.

### 4.5 Do / don't

| Do | Don't |
|---|---|
| Keep the owner → coral, resident → teal, caretaker → amber mapping everywhere a persona is shown | Reassign persona colors per-section for visual variety |
| Use `accent.500` for penjaga UI paired with dark text/icons | Put white body text on `accent.solid` (fails contrast, see §4.6) |
| Use `primary.700` / `secondary.700` / `critical.700` for solid white-text buttons and badges | Use the flagship 500 shades for large filled surfaces with white text (borderline-to-failing contrast) |
| Reserve full-strength `critical.500+` for confirmed alerts | Use critical color for routine validation |
| Route shadow colors through the `card`/`cardHover`/`glow` tokens | Hand-write `boxShadow="0 4px 16px rgba(...)"` inline |

### 4.6 Contrast notes

`primary.700` (#D62F2F), `secondary.700` (#1F7A72), and `critical.700` (#AD1F45) all clear 4.5:1+ against white — safe for white-text solid buttons and badges. The flagship 500/600 shades of those three families sit around 3–3.6:1 — fine for icons, large text (≥18px bold or ≥24px regular), or as a tint background paired with dark text, but don't set small white body copy on top of them. `accent` (Sunshine) has **no** white-text-safe shade in its normal range — always pair it with `gray.900`/`gray.800` text, never white.

---

## 4.7 Neutral — "Warm Sand," not cool ledger-slate

The neutral scale is warm-tinted (a soft sand/beige undertone) rather than the old cool navy-tinted gray — it pairs better with coral/teal/amber and reinforces "cozy home," not "audit terminal." `gray.50` (`#FBFAF9`) is the default page background; `gray.900` (`#211D19`) is the default heading ink color on light surfaces.

---

## 5. Typography

| Role | Family | Weight | Used for |
|---|---|---|---|
| Display / headings | **Baloo 2** | 600–800 | Page titles, section headers, persona card headlines |
| Body / UI | **Inter** | 400–600 | Everything else: labels, paragraphs, form fields, table text |

Baloo 2 is a rounded, high-x-height display face — it's the single biggest lever for "playful" and reads comfortably in Bahasa Indonesia. Inter stays for body copy because rounded faces hurt long-form readability at small sizes.

**No mandatory mono font.** Currency and numeric figures use the normal heading/body font, bold weight for emphasis, `fontVariantNumeric: "tabular-nums"` when several numbers need to align in a column (this is a numeric-alignment feature available on any font, not a special "ledger" face — see §0, §1.4).

### 5.2 Type scale (Chakra defaults, applied consistently)

| Token | Size | Use |
|---|---|---|
| `5xl`/`4xl` | 48/36px | Hero headline |
| `3xl`/`2xl` | 30/24px | Section headers |
| `xl`/`lg` | 20/18px | Card titles |
| `md` | 16px | Body default |
| `sm` | 14px | Secondary text |
| `xs` | 12px | Captions, eyebrows, badges |

---

## 6. Spacing, radius, elevation

- **Spacing**: Chakra's default spacing scale, unchanged.
- **Radius**: this is the other big "playful" lever. Cards use `2xl` (16px), buttons and pills use `full`, icon tiles use `xl` (12px). Nothing in the marketing surface should use the old `md` (8px) "standard, unremarkable" radius from v1.0 — bigger and rounder is the point.
- **Elevation**: two soft, warm-tinted shadow tokens — `card` (resting) and `cardHover` (lifted on hover/focus). A third, `glow`, is a coral-tinted shadow reserved for primary CTA emphasis. No hard 1px borders as the primary way to separate cards from background anymore — prefer shadow + generous radius (v1.0's "flat and precise, avoid playful depth" rule is explicitly reversed in v2.0).
- **Decoration**: soft organic "blob" shapes (`src/components/Blob`) may be used behind hero/section content for texture. Always `position="absolute"`, `pointerEvents="none"`, `aria-hidden="true"`, and contained by a `position="relative"; overflow="hidden"` ancestor so they never cause page-level horizontal scroll.

---

## 7. Motion

Reversed from v1.0's "kept deliberately quiet" rule — this is now a warm, lively product surface:

- Cards may lift on hover (`translateY(-4px)` + shadow swap from `card` to `cardHover`).
- A hero/proof element may scale-and-settle in on load, and a status badge may pop in with a slight overshoot (`ease: "backOut"`).
- Still respect `prefers-reduced-motion` everywhere (`useReducedMotion` from `framer-motion`) — nothing should depend on animation to be understandable, and motion should disable cleanly, not just slow down.
- Keep alerts/errors calm regardless of the friendlier motion budget elsewhere — a discrepancy or overdue notice still shouldn't bounce, shake, or pulse; seriousness there comes from copy and the `critical` color, not animation.

---

## 8. Component architecture

### 8.1 Two-tier folder convention

```
src/
  theme/
    system.ts
  components/
    ui/                     # Chakra CLI–generated snippets — vendor code, don't hand-edit
    Blob/                   # decorative background shape, §6
    SocialProofStats/
    <ComponentName>/         # Kosly's own composite/domain components
      index.ts
      <ComponentName>.tsx
      <ComponentName>.types.ts
  app/[locale]/_components/  # page-section components (Nav, Hero, HowItWorks, Trust, Marketing, Faq, …)
```

**Rule of thumb for when something needs its own folder:** if you're composing more than one Chakra primitive together, adding Kosly-specific business logic on top of a native Chakra component, or building something Chakra doesn't ship at all — it gets a folder. A bare `<Select>` used once inline does not.

### 8.2 Worked example — `HowItWorksColumn` (three-pillar persona card)

```tsx
// app/[locale]/_components/HowItWorksColumn.tsx
export function HowItWorksColumn({ eyebrow, headline, steps, ctaLabel, ctaHref, colorPalette, icon }: {
  eyebrow: string; headline: string; steps: string[]; ctaLabel: string; ctaHref: string;
  colorPalette: "primary" | "secondary" | "accent"; icon: ReactNode;
}) {
  return (
    <Box bg="white" borderRadius="2xl" boxShadow="card" borderTopWidth="6px" borderTopColor={`${colorPalette}.emphasized`} ...>
      <Box bg={`${colorPalette}.subtle`} color={`${colorPalette}.fg`} borderRadius="xl" ...>{icon}</Box>
      {/* eyebrow/headline/steps use colorPalette-scoped tokens throughout */}
      <Button asChild colorPalette={colorPalette} variant="outline" borderRadius="full">
        <Link href={ctaHref}>{ctaLabel}</Link>
      </Button>
    </Box>
  );
}
```

This is the canonical pattern for anything persona-scoped: take a `colorPalette: "primary" | "secondary" | "accent"` prop and derive every color from it (`${colorPalette}.subtle`, `.fg`, `.emphasized`, etc.) rather than hardcoding which persona gets which hue inside the component. The caller (`HowItWorks.tsx`) assigns owner→primary, resident→secondary, caretaker→accent per §4.1.

### 8.3 Functional components still needed (dashboard-facing, not yet built)

These are still the right shape for the eventual dashboard — the *visual* rules above changed, not the functional need:

| Component | Chakra base | Why it needs wrapping |
|---|---|---|
| `DatePicker` | native `DatePicker` (v3.34+) | id-ID locale + Kosly report presets |
| `PropertyCombobox` / `TenantCombobox` | native `Combobox` | async search against Kosly's API, debounced |
| `CurrencyInput` | `NumberInput` | Rupiah formatting via `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' })` |
| `DocumentDropzone` | native `FileUpload` | KTP/receipt-photo preview, size/type validation |
| `UnitStatusBadge` | `Badge` | 4-state room status; use an icon + label as the non-color signal (not the retired dashed/solid border rule — see §9) |
| `DiscrepancyAlert` | `Alert` / `Badge` | two-tier severity mapping, §4.4 |
| `AuditLogTable` | `Table` | one row per ledger entry — normal numeral styling now, not mono (§5) |
| `PaymentStatusTag` | `Tag` | paid / due / overdue / verified |

**Retired from v1.0:** `LedgerAmount` (the mono "stamp" chip) is deleted. Format currency inline with `Intl.NumberFormat` plus bold weight where a figure needs emphasis — it's simple enough now to not need a dedicated component, since the mono/stamp signature that justified one is gone.

---

## 9. Accessibility checklist

- Body text and interactive-element contrast ≥ 4.5:1; large text/icons ≥ 3:1 (see §4.6 for which shades are safe where).
- Never encode meaning in color alone. v1.0 used a dashed-vs-solid border rule for this; v2.0 uses **icon + label** instead (e.g. a checkmark icon + "Verified" text, not just a color swap) since the border-style signature was part of the retired ledger motif.
- Focus rings always visible via the `focusRing` semantic token — don't suppress `:focus-visible` outlines anywhere.
- Minimum 40px tap targets on interactive controls.
- Leave room in layouts for Bahasa Indonesia strings, which often run longer than their English equivalents — avoid fixed-width truncating labels on badges/buttons.
- When using Chakra's `asChild` (§1.5), the single child element must itself be able to receive a ref and arbitrary DOM props (a real `<a>`, `next-intl`'s `Link`, etc.) — don't nest a non-forwarding custom component as the `asChild` target.

---

## 10. File tree summary

```
src/
  theme/
    system.ts
  app/
    [locale]/
      layout.tsx              # font loading (§2.2)
      page.tsx
      _components/
        Nav.tsx
        Hero.tsx
        HeroStamp.tsx
        HowItWorks.tsx
        HowItWorksColumn.tsx
        HowItWorksTabs.tsx
        Trust.tsx
        Marketing.tsx
        Faq.tsx
  components/
    ui/                      # Chakra-generated snippets — don't hand-edit
    Blob/
    SocialProofStats/
    DatePicker/               # not yet built — see §8.3
    PropertyCombobox/
    TenantCombobox/
    CurrencyInput/
    DocumentDropzone/
    UnitStatusBadge/
    DiscrepancyAlert/
    AuditLogTable/
    PaymentStatusTag/
```

---

## 11. Quick reference — do / don't

| Do | Don't |
|---|---|
| Keep the owner=coral / resident=teal / caretaker=amber mapping everywhere a persona appears | Reassign persona colors per page |
| Use `asChild` + a single child element for any Chakra component that needs to render as a link | Use `as={Link} href=...` — fails Chakra v3's types and `next build` |
| Pass rendered icon elements (`<Building2 />`) from server components into client components | Pass raw icon component references — breaks the RSC serialization boundary |
| Use `primary.700` / `secondary.700` / `critical.700` for solid white-text surfaces | Reach for the flagship 500 shade on a large filled surface with white text (contrast) |
| Use full-strength `critical.500+` only for confirmed alerts | Use critical color for routine validation states |
| Signal verification status with an icon + label | Rely on a border-style (dashed/solid) or color alone — that convention is retired |
| Build composite/domain components as folders per §8.1 | Inline a one-off composition Chakra already ships as a primitive |
