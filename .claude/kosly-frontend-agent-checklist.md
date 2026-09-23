# Kosly Frontend — Agent Build Checklist

*Prepared by: Tech Lead · For: the coding agent building the Kosly frontend*
*Companion doc: `kosly-design-system.md` (read that first, every time — §1 below)*

---

## How to use this file

Run through the relevant phase **before**, **during**, and **after** any frontend work on Kosly, in this order: **Phase 0 → 1 → 2 → 3 → 4 → 5**. Treat every unchecked box as blocking, not optional. If a box can't honestly be checked because a requirement is missing or ambiguous (most often a missing API contract), **stop and log it — don't guess and move on.** §4 tells you exactly where that gets logged.

Two working assumptions baked into this checklist — override them explicitly if wrong, don't silently drift from them:
- **Default locale is `id` (Bahasa Indonesia)**, with `en` as the secondary/toggle language. Primary market and primary buyer (the owner) are Indonesian.
- **Backend is the native-PHP API described in the BA report** (front controller, PDO/prepared statements, JWT bearer auth, append-only ledger). §4's handoff template assumes that shape.

---

## Phase 0 — Before writing any code

- [ ] Read `kosly-design-system.md` in full (not just the color table — the component-folder convention in §8 and the a11y checklist in §9 are load-bearing, not optional reading).
- [ ] Confirm `src/theme/system.ts` exists and matches the token values in the design doc §2.1. If it doesn't exist yet, set it up **first**, before any UI work — every component downstream depends on it.
- [ ] Confirm the i18n scaffold exists (§2 below). If it doesn't, set it up before writing the first user-facing component — retrofitting hardcoded strings later is real rework, not a formality.
- [ ] Confirm `.env.example` exists and is current. If you're about to introduce a new config value (API URL, gateway key, feature flag), that's a Phase 0 problem, not something to hardcode "for now."
- [ ] Check `src/components/` for an existing folder before creating a new composite component — don't duplicate a `DatePicker` or `CurrencyInput` that already exists under a slightly different name.
- [ ] If the task touches money, the ledger, or tenant PII (KTP scans, contracts) — flag it mentally now. §3's rules apply with extra weight to this code, and it's exactly the code most worth a second read before you call it done.

---

## Phase 1 — Design-system compliance (while coding)

Condensed from `kosly-design-system.md` — this is a gate, not a re-read. Full detail lives in the linked sections.

- [ ] No raw hex codes or ad hoc colors in component code — theme tokens only (design doc §1, §4).
- [ ] Every currency figure, transaction ID, and timestamp goes through `LedgerAmount` / the mono tabular-numeral rule — never formatted inline (design doc §5.3, §8.5).
- [ ] Any composite/interactive control that isn't a single Chakra import gets its own `components/<Name>/` folder (design doc §8.1–8.3).
- [ ] Verification/status states carry a border-style or icon change, not color alone (design doc §6, §9).
- [ ] Contrast, focus rings, and 40px tap targets checked for anything new (design doc §9).

---

## Phase 2 — Internationalization (eng + idn, mandatory on every screen)

**Library: `next-intl`** (the current standard for Next.js App Router — Server Component support, no hydration cost for server-rendered strings). Don't introduce `next-i18next` or a second i18n library alongside it.

### 2.1 Setup shape

```
src/
  i18n/
    routing.ts          # locales: ['id', 'en'], defaultLocale: 'id'
    request.ts          # server-side message loading
  messages/
    id.json              # Bahasa Indonesia — default, ships first
    en.json               # English — must stay in lockstep with id.json
  app/
    [locale]/
      layout.tsx
      ...
  middleware.ts           # next-intl locale negotiation/routing
```

### 2.2 Rules

- [ ] **Zero literal user-facing strings in JSX.** Every label, button, error message, empty state, and toast goes through `useTranslations()` (client) or `getTranslations()` (server) — no exceptions for "just a placeholder," placeholders get real keys too.
- [ ] **A key never lands in one locale file without the other.** Adding `messages/id.json:"unit.status.overdue"` without the matching `messages/en.json` entry in the same commit is a broken build, not a follow-up task.
- [ ] Key naming is namespaced by feature/component, not flat: `unit.status.overdue`, `ledger.discrepancyAlert.title`, `auth.login.submitLabel` — not `overdue` or `submit`.
- [ ] Dates and currency always go through locale-aware `Intl` formatting (`Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' })` per the design doc's `LedgerAmount`, `Intl.DateTimeFormat` for dates) — never a manually built date/currency string, in either language.
- [ ] Indonesian strings are checked for length against their English counterpart before shipping a layout — Indonesian frequently runs longer (design doc §9 flagged this for badges specifically; it applies to buttons and nav labels too).
- [ ] No machine-placeholder text (`"TODO: translate"`, raw English left in `id.json`) ships in either file.

### 2.3 Self-check before marking a task done

There's no bundled lint rule enforcing this yet (`next-intl` doesn't ship one) — until one is added, manually scan new files, or run a heuristic pass:

```bash
# Heuristic: flags likely literal JSX text nodes (English/Indonesian words between tags).
# Not exhaustive — a real read of new files still matters more than this.
grep -rnE '>[A-Za-z][a-zA-Z ]{3,}<' src/app src/components --include="*.tsx" | grep -v "useTranslations\|getTranslations"
```

---

## Phase 3 — Security checklist

- [ ] **Token storage.** Don't store the JWT in `localStorage` or `sessionStorage` — both are readable by any injected script (XSS risk), and this is a financial-trust product where that risk is not abstract. Default to an httpOnly, `Secure`, `SameSite=Strict` cookie set by the backend, or an in-memory token with silent refresh. **This is a joint frontend/backend decision — if it isn't already pinned down, it's the first thing to put in the API requirements doc (§4), not something to decide unilaterally on the frontend.**
- [ ] `grep -rn "localStorage.setItem\|sessionStorage.setItem" src/` before finishing a task that touches auth — confirm nothing token-shaped is going in.
- [ ] Client-side validation is a UX nicety, not a security boundary — assume the backend re-validates everything, and don't build a false sense of safety into the frontend code or comments.
- [ ] No `dangerouslySetInnerHTML` without sanitization (`DOMPurify` or equivalent) if any rich-text/HTML rendering is ever introduced (e.g., a caretaker's free-text note). Default to plain text rendering unless there's a stated reason not to.
- [ ] CSRF: token-based `Authorization: Bearer` auth (header, not cookie) is inherently low-CSRF-exposure. If the token-storage decision above lands on a cookie instead, CSRF protection (double-submit token or `SameSite=Strict`) becomes mandatory, not optional — note this dependency in the handoff doc.
- [ ] `npm audit` run before adding any new dependency; don't add a package that's unmaintained or has open high/critical advisories without flagging it.
- [ ] **No financial or PII data in `console.log`, ever** — not even in development. Ledger amounts, tenant KTP data, and phone numbers are the exact data this product exists to protect; logging them casually undercuts the entire positioning. `grep -rn "console.log" src/` and check anything touching `transaction`, `ledger`, `ktp`, `tenant`, `amount` before finishing.
- [ ] KTP/receipt photo uploads: don't persist the raw file/blob in any client-side store (React state is fine transiently; nothing goes to `localStorage`/`IndexedDB`) — clear it from memory once the upload is confirmed.
- [ ] All API calls go over HTTPS; no mixed-content requests. If the API base URL comes from env (§4) and someone points it at plain `http://` in a non-local environment, that's a stop-and-flag, not a warning-and-continue.
- [ ] Double-submit guards on anything that writes a ledger entry (payment confirmation, corrective entry) — disable the button/debounce on submit. This is a UX safeguard against accidental duplicate financial rows, not a substitute for the backend's own idempotency handling.
- [ ] CORS and CSP are backend/infra-owned, but if a task surfaces a specific frontend need (e.g., a new third-party script, a new allowed origin), note it in the API requirements doc rather than working around it client-side.

---

## Phase 4 — Environment & config (nothing hardcoded)

- [ ] **No hardcoded API base URLs, endpoint paths' host portion, gateway keys, or environment-specific values anywhere in component/page code.** Everything comes from `process.env`.
- [ ] Client-exposed values use the `NEXT_PUBLIC_` prefix (e.g., `NEXT_PUBLIC_API_BASE_URL`) — and precisely because that prefix means "this ships in the browser bundle," nothing secret ever gets that prefix. Server-only values (if any Next.js server actions/route handlers need them) stay unprefixed.
- [ ] `.env.example` is committed and kept current, with placeholder values only. `.env.local` (real values) is git-ignored — confirm it's actually in `.gitignore`, don't assume.
- [ ] A single shared API client module (e.g., `src/lib/api-client.ts`) reads `NEXT_PUBLIC_API_BASE_URL` once — nothing else in the codebase constructs a base URL independently.
- [ ] Before finishing a task, self-check for slip-ups:

```bash
# Flags likely-hardcoded absolute URLs outside env/config files
grep -rn "https\?://" src/ --include="*.ts" --include="*.tsx" \
  | grep -v "\.env\|api-client\|next.config"

# Flags anything that looks like an inline secret/token pattern
grep -rnE "(api[_-]?key|secret|token)\s*[:=]\s*['\"][A-Za-z0-9_\-]{10,}" src/
```

Both should return nothing outside of expected config files. If either flags something, fix it before moving on — don't leave it for a "cleanup pass."

---

## Phase 5 — Session end: backend/API requirements handoff

Kosly's frontend and backend are being built by separate agents. **Any time you need an endpoint that doesn't exist yet, or the shape of an existing one is unclear, write it down as it happens** — don't invent a plausible response shape and quietly build against it. At the end of the session, consolidate everything into one file:

**File: `kosly-api-requirements.md`** (project root, or wherever the backend agent reads from).

- [ ] If the file already exists, **append/update** — don't overwrite prior entries. Mark resolved items `✅ Implemented` rather than deleting them, so there's a running record.
- [ ] Every new or changed endpoint need from this session is captured using the template below before the session is considered done.
- [ ] If the token-storage decision from Phase 3 isn't already settled, it's logged as the first entry — it affects both sides of the API.

### Template — one block per endpoint

```markdown
### [Feature] Endpoint short name

- **Purpose:** what this powers on the frontend, in plain terms
- **Method & path:** e.g. `POST /api/v1/units/{id}/ledger-entries` (path only — base URL is env-driven on our side, never hardcode it in examples either)
- **Auth:** e.g. `Authorization: Bearer <jwt>`, required role (owner/caretaker/tenant)
- **Request body:**
  ```json
  { "example": "shape frontend needs to send" }
  ```
- **Success response (2xx):**
  ```json
  { "example": "shape frontend needs to receive" }
  ```
- **Error response(s):** expected error codes/shapes the frontend needs to handle (e.g. 401 expired token, 409 duplicate corrective entry, 422 validation)
- **Backend conventions to respect** (per BA report §7): PDO prepared statements; no destructive `UPDATE`/`DELETE` on posted ledger rows — corrections are new rows referencing the original; every ledger write needs `actor_id`, `actor_role`, `created_at`
- **Frontend component(s) that consume this:** e.g. `LedgerAmount`, `AuditLogTable`
- **Priority:** MVP / Phase 2 / Phase 3 (per the BA report's roadmap)
- **Status:** 🔲 Needed / ✅ Implemented
```

---

## Final self-check before calling a task "done"

- [ ] Design-system compliance re-verified (Phase 1)
- [ ] Every new string exists in **both** `id.json` and `en.json` (Phase 2)
- [ ] Env/secrets grep checks come back clean (Phase 4)
- [ ] Security checklist items satisfied, especially token storage and no-logging-sensitive-data (Phase 3)
- [ ] `kosly-api-requirements.md` created or updated if this session surfaced any backend need (Phase 5)
- [ ] Lint, typecheck, and build all pass
