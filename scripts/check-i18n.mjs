#!/usr/bin/env node
// i18n lockstep check (checklist Phase 2). Run: node scripts/check-i18n.mjs
//  1. messages/id.json and messages/en.json have exactly the same keys.
//  2. Each key uses the same {placeholders} in both languages.
//  3. Every literal t("key") in src/ resolves to a key in both files. Dynamic keys (template literals) must at
//     least resolve to an existing branch, and their known values are listed below so a typo can't hide.
//  4. No key is left unused (after ignoring dynamic prefixes), so dead copy doesn't pile up.
//  5. No empty strings, and no id string that is byte-identical to en unless it's on the allow-list.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const en = JSON.parse(readFileSync(join(root, "messages/en.json"), "utf8"));
const id = JSON.parse(readFileSync(join(root, "messages/id.json"), "utf8"));

function flatten(object, prefix = "") {
  const out = {};
  for (const [key, value] of Object.entries(object)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object") Object.assign(out, flatten(value, path));
    else out[path] = value;
  }
  return out;
}
const flatEn = flatten(en);
const flatId = flatten(id);

const problems = [];
const problem = (message) => problems.push(message);

// 1. same keys
for (const key of Object.keys(flatEn)) if (!(key in flatId)) problem(`missing in id.json: ${key}`);
for (const key of Object.keys(flatId)) if (!(key in flatEn)) problem(`missing in en.json: ${key}`);

// 2. same placeholders; 5. non-empty
const placeholders = (text) => [...String(text).matchAll(/\{\s*(\w+)\s*[,}]/g)].map((m) => m[1]).sort().join(",");
for (const key of Object.keys(flatEn)) {
  if (!(key in flatId)) continue;
  if (String(flatEn[key]).trim() === "" || String(flatId[key]).trim() === "") problem(`empty string: ${key}`);
  if (placeholders(flatEn[key]) !== placeholders(flatId[key])) {
    problem(`placeholder mismatch in ${key}: en {${placeholders(flatEn[key])}} vs id {${placeholders(flatId[key])}}`);
  }
}
// Words that are legitimately the same in both languages.
const SAME_OK = /^(Kosly|ID|EN|Rp|WhatsApp|Email|OK|[A-Z0-9 .,/-]+)$/;
// Keys whose text is legitimately identical in both languages (a language's own name, a pure template).
const IDENTICAL_KEYS = new Set(["common.localeName.id", "common.localeName.en", "kos.header.address"]);
for (const key of Object.keys(flatEn)) {
  if (key.startsWith("legal.") || IDENTICAL_KEYS.has(key)) continue;
  if (flatEn[key] === flatId[key] && !SAME_OK.test(flatEn[key]) && flatEn[key].length > 12) {
    problem(`id.json is identical to en.json (untranslated?): ${key}`);
  }
}

// 3. code usage
function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}
const used = new Set();
const dynamicPrefixes = new Set();
const unverifiable = [];

for (const file of walk(join(root, "src"))) {
  const source = readFileSync(file, "utf8");
  const vars = new Map(); // variable -> namespace
  for (const m of source.matchAll(/(?:const|let)\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(\s*(?:"([^"]*)"|\{[^)]*?namespace:\s*"([^"]*)"[^)]*\})?\s*\)/g)) {
    vars.set(m[1], m[2] ?? m[3] ?? "");
  }
  for (const [variable, namespace] of vars) {
    const scope = (key) => (namespace ? `${namespace}.${key}` : key);
    const call = new RegExp(`\\b${variable}(?:\\.has)?\\(\\s*([^)]*)`, "g");
    for (const m of source.matchAll(call)) {
      const arg = m[1].trim();
      const literal = arg.match(/^"([^"]+)"/);
      const template = arg.match(/^`([^`]+)`/);
      if (literal) used.add(scope(literal[1]));
      else if (template) {
        const text = template[1];
        const cut = text.indexOf("${");
        if (cut === -1) used.add(scope(text));
        else dynamicPrefixes.add(scope(text.slice(0, cut)));
      } else if (arg.length > 0 && !/^\w+\.\w+\s*\?/.test(arg.slice(0, 0))) {
        unverifiable.push(`${file.replace(root, "")}: ${variable}(${arg.slice(0, 60)}...)`);
      }
    }
    // t.has(...) used to test optional keys is counted above; ternaries with two literals:
    for (const m of source.matchAll(new RegExp(`\\b${variable}\\(\\s*[^)]*?\\?\\s*(?:"([^"]+)"|\`([^\`$]+)\`)\\s*:\\s*(?:"([^"]+)"|\`([^\`$]+)\`)`, "g"))) {
      for (const literal of [m[1], m[2], m[3], m[4]]) if (literal) used.add(scope(literal));
    }
  }
}

// Keys reached through a variable (tRole(role), t(`items.${key}`), API error codes, ...). Their possible values
// are fixed by types or by the API contract, so they're listed here and checked like literals.
const API_ERROR_CODES = [
  "unauthenticated", "forbidden", "not_found", "bad_request", "method_not_allowed", "verification_required",
  "validation_failed", "email_taken", "invalid_credentials", "too_many_attempts", "verification_invalid",
  "verification_expired", "verification_locked", "verification_cooldown", "verification_not_sent",
  "already_verified", "plan_limit_reached", "kos_read_only", "invite_not_found", "invite_expired",
  "invite_revoked", "invite_used", "invite_not_active", "already_member", "request_exists", "code_not_found",
  "room_taken", "request_already_decided",
];
const ROLES = ["owner", "tenant", "caretaker"];
const STATUSES = ["vacant", "paid", "due", "overdue"];
const INVITE_STATUSES = ["active", "used", "expired", "revoked"];
const REQUIRED = [
  ...ROLES.map((r) => `common.roles.${r}`),
  ...STATUSES.map((r) => `common.roomStatus.${r}`),
  ...["id", "en"].map((r) => `common.localeName.${r}`),
  ...API_ERROR_CODES.map((c) => `apiErrors.${c}`),
  "apiErrors.network", "apiErrors.generic",
  ...ROLES.map((r) => `register.role.${r}.label`),
  ...ROLES.map((r) => `register.role.${r}.description`),
  ...["expired", "revoked", "used", "unknown"].map((r) => `register.invite.unusable.${r}`),
  ...["email", "whatsapp"].flatMap((c) => [`verify.channel.${c}.label`, `verify.channel.${c}.description`]),
  ...["expired", "revoked", "used"].flatMap((r) => [`invite.unusable.${r}.title`, `invite.unusable.${r}.body`]),
  ...["caretaker", "tenant"].map((r) => `kos.invite.roleHelp.${r}`),
  ...["setupKos", "inviteCaretaker", "inviteResident"].map((r) => `kos.checklist.items.${r}`),
  ...INVITE_STATUSES.map((r) => `kos.invites.status.${r}`),
  ...STATUSES.map((r) => `kos.resident.statusNote.${r}`),
  ...["caretaker", "tenant"].map((r) => `guestOnboarding.done.body.${r}`),
  ...["limit", "readOnly"].flatMap((r) => [`upgrade.${r}.title`, `upgrade.${r}.body`]),
  ...["free", "pro"].map((r) => `app.userMenu.plan.${r}`),
];
for (const key of REQUIRED) used.add(key);

for (const key of used) {
  if (!(key in flatEn)) problem(`used in code but missing in en.json: ${key}`);
  if (!(key in flatId)) problem(`used in code but missing in id.json: ${key}`);
}
for (const prefix of dynamicPrefixes) {
  const branch = prefix.replace(/\.$/, "");
  const has = Object.keys(flatEn).some((k) => k === branch || k.startsWith(prefix) || k.startsWith(`${branch}.`));
  if (!has) problem(`dynamic key prefix has no messages: ${prefix}\${...}`);
}

// 4. unused keys (skip namespaces that are consumed by another mechanism)
const CONSUMED_ELSEWHERE = ["legal.", "landing.", "notFound.", "metadata."];
const dynamicUnder = [...dynamicPrefixes];
for (const key of Object.keys(flatEn)) {
  if (CONSUMED_ELSEWHERE.some((p) => key.startsWith(p))) continue;
  if (used.has(key)) continue;
  if (dynamicUnder.some((p) => key.startsWith(p))) continue;
  problem(`unused key (dead copy?): ${key}`);
}

console.log(`${Object.keys(flatEn).length} en keys, ${Object.keys(flatId).length} id keys, ${used.size} literal + ${dynamicPrefixes.size} dynamic usages checked`);
if (unverifiable.length) {
  console.log(`\nDynamic calls (their value sets are listed in REQUIRED and checked above):`);
  for (const line of unverifiable) console.log(`  ${line}`);
}
if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  for (const line of problems) console.log(`  - ${line}`);
  process.exit(1);
}
console.log("i18n OK: both languages are in lockstep.");
