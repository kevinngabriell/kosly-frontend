#!/usr/bin/env node
// Runs the API-level scenarios from docs/test-scenarios.md against a running dev server that has
// KOSLY_MOCK_API=true. Each scenario resets the mock database first, so they're independent.
//
//   npm run dev                       # in one terminal
//   node scripts/check-mock-api.mjs   # in another (BASE_URL=http://localhost:3001 to change port)
//   node scripts/check-mock-api.mjs --only=VER    # run only scenario IDs starting with "VER"
//
// Scenario IDs (REG-A01 ...) match the rows in docs/test-scenarios.md. The "A" means API-level; UI-level
// scenarios in that doc are verified by hand.
import assert from "node:assert/strict";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const PASSWORD = "Kosly1234!";
const only = process.argv.find((a) => a.startsWith("--only="))?.slice("--only=".length);

/** A tiny cookie-jar client so each "person" keeps their own session. */
function person() {
  let cookie = "";
  const api = {
    async call(method, path, body) {
      const headers = {};
      if (body !== undefined && typeof body !== "string") headers["content-type"] = "application/json";
      if (cookie) headers.cookie = cookie;
      const res = await fetch(`${BASE}/api/v1${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
      });
      const setCookies = res.headers.getSetCookie();
      for (const line of setCookies) {
        const [pair] = line.split(";");
        const eq = pair.indexOf("=");
        const value = pair.slice(eq + 1);
        cookie = value ? pair : "";
      }
      const text = await res.text();
      let json;
      try {
        json = text ? JSON.parse(text) : undefined;
      } catch {
        json = undefined;
      }
      return { status: res.status, json, setCookies, text };
    },
    get: (path) => api.call("GET", path),
    post: (path, body = {}) => api.call("POST", path, body),
    patch: (path, body = {}) => api.call("PATCH", path, body),
    del: (path) => api.call("DELETE", path),
    async login(email, extra = {}) {
      const res = await api.post("/auth/login", { email, password: PASSWORD, ...extra });
      assert.equal(res.status, 200, `login ${email} -> ${res.status} ${res.text}`);
      return res.json;
    },
    setRawCookie(value) {
      cookie = value;
    },
  };
  return api;
}

async function loggedIn(email) {
  const p = person();
  await p.login(email);
  return p;
}

const code = (res) => res.json?.error?.code;
const fieldsOf = (res) => res.json?.error?.fields ?? {};
const expectError = (res, status, errorCode) => {
  assert.equal(res.status, status, `expected ${status} ${errorCode}, got ${res.status} ${res.text}`);
  assert.equal(code(res), errorCode);
};
const membershipOf = (me, kosId) => me.memberships.find((m) => m.kos.id === kosId);

const scenarios = [];
const S = (id, title, fn) => scenarios.push({ id, title, fn });

const VALID_REGISTER = {
  fullName: "Test Person",
  email: "test.person@example.com",
  phone: "081200001111",
  password: PASSWORD,
  intent: "owner",
};

// =====================================================================================================
// REG — register
// =====================================================================================================
S("REG-A01", "valid register creates an unverified account, auto-logs in", async () => {
  const p = person();
  const res = await p.post("/auth/register", VALID_REGISTER);
  assert.equal(res.status, 201);
  assert.equal(res.json.user.verified, false);
  assert.equal(res.json.user.intent, "owner");
  assert.deepEqual(res.json.memberships, []);
  assert.equal((await p.get("/me")).status, 200, "session cookie should already work");
});
S("REG-A02", "missing full name is rejected", async () => {
  const res = await person().post("/auth/register", { ...VALID_REGISTER, fullName: "   " });
  expectError(res, 422, "validation_failed");
  assert.equal(fieldsOf(res).fullName, "required");
});
S("REG-A03", "missing or malformed email is rejected", async () => {
  const missing = await person().post("/auth/register", { ...VALID_REGISTER, email: "" });
  assert.equal(fieldsOf(missing).email, "required");
  const bad = await person().post("/auth/register", { ...VALID_REGISTER, email: "not-an-email" });
  assert.equal(fieldsOf(bad).email, "invalid");
});
S("REG-A04", "password shorter than 8 characters is rejected, exactly 8 is accepted", async () => {
  const short = await person().post("/auth/register", { ...VALID_REGISTER, password: "1234567" });
  assert.equal(fieldsOf(short).password, "too_short");
  const ok = await person().post("/auth/register", { ...VALID_REGISTER, password: "12345678" });
  assert.equal(ok.status, 201);
});
S("REG-A05", "phone is optional but must look like a phone number when given", async () => {
  const bad = await person().post("/auth/register", { ...VALID_REGISTER, phone: "abc" });
  assert.equal(fieldsOf(bad).phone, "invalid");
  const omitted = await person().post("/auth/register", { ...VALID_REGISTER, phone: undefined });
  assert.equal(omitted.status, 201);
  assert.equal(omitted.json.user.phone, null);
});
S("REG-A06", "unknown intent is rejected; all three real intents are accepted", async () => {
  const bad = await person().post("/auth/register", { ...VALID_REGISTER, intent: "admin" });
  assert.equal(fieldsOf(bad).intent, "invalid");
  for (const intent of ["owner", "tenant", "caretaker"]) {
    const res = await person().post("/auth/register", { ...VALID_REGISTER, email: `${intent}@example.com`, intent });
    assert.equal(res.status, 201);
    assert.equal(res.json.user.intent, intent);
  }
});
S("REG-A07", "duplicate email is rejected, case-insensitively", async () => {
  expectError(await person().post("/auth/register", { ...VALID_REGISTER, email: "OWNER@kosly.dev" }), 409, "email_taken");
});
S("REG-A08", "email is trimmed and lower-cased", async () => {
  const p = person();
  const res = await p.post("/auth/register", { ...VALID_REGISTER, email: "  Mixed.Case@Example.COM " });
  assert.equal(res.json.user.email, "mixed.case@example.com");
});
S("REG-A09", "registering through a valid invite forces the invite's role as intent", async () => {
  const res = await person().post("/auth/register", { ...VALID_REGISTER, intent: "owner", inviteToken: "inv_caretaker_ok" });
  assert.equal(res.status, 201);
  assert.equal(res.json.user.intent, "caretaker");
});
S("REG-A10", "an unusable invite blocks registration and creates no account", async () => {
  const cases = [
    ["inv_expired", 410, "invite_expired"],
    ["inv_revoked", 410, "invite_revoked"],
    ["inv_used", 409, "invite_used"],
    ["inv_nope", 404, "invite_not_found"],
  ];
  for (const [token, status, errorCode] of cases) {
    expectError(await person().post("/auth/register", { ...VALID_REGISTER, inviteToken: token }), status, errorCode);
  }
  const login = await person().post("/auth/login", { email: VALID_REGISTER.email, password: PASSWORD });
  expectError(login, 401, "invalid_credentials");
});
S("REG-A11", "a body that isn't JSON is a 400", async () => {
  expectError(await person().call("POST", "/auth/register", "{not json"), 400, "bad_request");
});
S("REG-A12", "several errors are reported together, not one at a time", async () => {
  const res = await person().post("/auth/register", { fullName: "", email: "x", password: "1", intent: "owner" });
  assert.deepEqual(Object.keys(fieldsOf(res)).sort(), ["email", "fullName", "password"]);
});

// =====================================================================================================
// LOG — login / logout / session
// =====================================================================================================
S("LOG-A01", "valid login returns the profile and sets an httpOnly session cookie", async () => {
  const res = await person().post("/auth/login", { email: "owner@kosly.dev", password: PASSWORD });
  assert.equal(res.status, 200);
  assert.equal(res.json.user.email, "owner@kosly.dev");
  assert.equal(res.json.memberships[0].role, "owner");
  const cookie = res.setCookies[0];
  assert.match(cookie, /^kosly_session=/);
  assert.match(cookie, /HttpOnly/);
});
S("LOG-A02", "wrong password is a 401 invalid_credentials", async () => {
  expectError(await person().post("/auth/login", { email: "owner@kosly.dev", password: "nope-nope" }), 401, "invalid_credentials");
});
S("LOG-A03", "unknown email gives the same error as a wrong password (no account enumeration)", async () => {
  const unknown = await person().post("/auth/login", { email: "ghost@kosly.dev", password: PASSWORD });
  expectError(unknown, 401, "invalid_credentials");
});
S("LOG-A04", "five wrong passwords lock the account, even for the right password", async () => {
  const p = person();
  for (let i = 0; i < 5; i += 1) {
    expectError(await p.post("/auth/login", { email: "lock@kosly.dev", password: "wrong-pass" }), 401, "invalid_credentials");
  }
  const locked = await p.post("/auth/login", { email: "lock@kosly.dev", password: PASSWORD });
  expectError(locked, 429, "too_many_attempts");
  assert.ok(locked.json.error.retryAfterSeconds > 0);
});
S("LOG-A05", "email is matched case-insensitively", async () => {
  assert.equal((await person().post("/auth/login", { email: "  OWNER@Kosly.dev ", password: PASSWORD })).status, 200);
});
S("LOG-A06", "an unverified account can log in and is told it's unverified", async () => {
  const res = await person().post("/auth/login", { email: "unverified@kosly.dev", password: PASSWORD });
  assert.equal(res.status, 200);
  assert.equal(res.json.user.verified, false);
});
S("LOG-A07", "remember-me gives a persistent cookie, otherwise a session cookie", async () => {
  const remembered = await person().post("/auth/login", { email: "owner@kosly.dev", password: PASSWORD, rememberMe: true });
  assert.match(remembered.setCookies[0], /Max-Age=\d+/);
  const plain = await person().post("/auth/login", { email: "owner@kosly.dev", password: PASSWORD, rememberMe: false });
  assert.doesNotMatch(plain.setCookies[0], /Max-Age/);
});
S("LOG-A08", "empty email or password is a 422", async () => {
  assert.equal(fieldsOf(await person().post("/auth/login", { email: "", password: PASSWORD })).email, "required");
  assert.equal(fieldsOf(await person().post("/auth/login", { email: "owner@kosly.dev", password: "" })).password, "required");
});
S("LOG-A09", "a successful login resets the failure counter", async () => {
  const p = person();
  for (let i = 0; i < 4; i += 1) await p.post("/auth/login", { email: "lock@kosly.dev", password: "wrong-pass" });
  assert.equal((await p.post("/auth/login", { email: "lock@kosly.dev", password: PASSWORD })).status, 200);
  for (let i = 0; i < 4; i += 1) {
    expectError(await p.post("/auth/login", { email: "lock@kosly.dev", password: "wrong-pass" }), 401, "invalid_credentials");
  }
});
S("LOG-A10", "logout ends the session; the old cookie stops working", async () => {
  const p = person();
  const res = await p.post("/auth/login", { email: "owner@kosly.dev", password: PASSWORD });
  const savedCookie = res.setCookies[0].split(";")[0];
  assert.equal((await p.post("/auth/logout")).status, 204);
  assert.equal((await p.get("/me")).status, 401);
  const replay = person();
  replay.setRawCookie(savedCookie);
  expectError(await replay.get("/me"), 401, "unauthenticated");
});
S("LOG-A11", "/me without a cookie, or with a forged one, is a 401", async () => {
  expectError(await person().get("/me"), 401, "unauthenticated");
  const forged = person();
  forged.setRawCookie("kosly_session=ses_forged");
  expectError(await forged.get("/me"), 401, "unauthenticated");
});
S("LOG-A12", "logout when not logged in is harmless", async () => {
  assert.equal((await person().post("/auth/logout")).status, 204);
});

// =====================================================================================================
// VER — verification gate
// =====================================================================================================
S("VER-A01", "sending an email code records the channel and a resend time", async () => {
  const p = await loggedIn("unverified@kosly.dev");
  const res = await p.post("/auth/verification/send", { channel: "email" });
  assert.equal(res.status, 200);
  assert.equal(res.json.user.verification.channel, "email");
  assert.ok(new Date(res.json.user.verification.resendAvailableAt) > new Date());
});
S("VER-A02", "WhatsApp needs a phone number when the account has none", async () => {
  const p = await loggedIn("unverified@kosly.dev"); // seeded without a phone
  const res = await p.post("/auth/verification/send", { channel: "whatsapp" });
  expectError(res, 422, "validation_failed");
  assert.equal(fieldsOf(res).phone, "required");
});
S("VER-A03", "WhatsApp validates the phone, then saves it to the account", async () => {
  const p = await loggedIn("unverified@kosly.dev");
  assert.equal(fieldsOf(await p.post("/auth/verification/send", { channel: "whatsapp", phone: "12" })).phone, "invalid");
  const ok = await p.post("/auth/verification/send", { channel: "whatsapp", phone: "081234000111" });
  assert.equal(ok.status, 200);
  assert.equal(ok.json.user.phone, "081234000111");
  assert.equal(ok.json.user.verification.channel, "whatsapp");
});
S("VER-A04", "WhatsApp reuses the phone already on the account", async () => {
  const p = await loggedIn("verifying@kosly.dev"); // has a phone, and a code already outstanding
  const res = await p.post("/auth/verification/send", { channel: "whatsapp" });
  expectError(res, 429, "verification_cooldown"); // proves it got past the phone check
});
S("VER-A05", "an unknown channel is rejected", async () => {
  const p = await loggedIn("unverified@kosly.dev");
  assert.equal(fieldsOf(await p.post("/auth/verification/send", { channel: "sms" })).channel, "invalid");
});
S("VER-A06", "resending inside the cooldown is a 429 with a wait time", async () => {
  const p = await loggedIn("unverified@kosly.dev");
  await p.post("/auth/verification/send", { channel: "email" });
  const again = await p.post("/auth/verification/send", { channel: "email" });
  expectError(again, 429, "verification_cooldown");
  assert.ok(again.json.error.retryAfterSeconds > 0 && again.json.error.retryAfterSeconds <= 60);
});
S("VER-A07", "the right code verifies the account and clears the pending state", async () => {
  const p = await loggedIn("unverified@kosly.dev");
  await p.post("/auth/verification/send", { channel: "email" });
  const res = await p.post("/auth/verification/confirm", { code: "123456" });
  assert.equal(res.status, 200);
  assert.equal(res.json.user.verified, true);
  assert.equal(res.json.user.verification, null);
});
S("VER-A08", "a wrong code says how many tries are left", async () => {
  const p = await loggedIn("unverified@kosly.dev");
  await p.post("/auth/verification/send", { channel: "email" });
  const res = await p.post("/auth/verification/confirm", { code: "654321" });
  expectError(res, 400, "verification_invalid");
  assert.equal(res.json.error.attemptsLeft, 4);
});
S("VER-A09", "five wrong codes lock verification, even the right code is then refused", async () => {
  const p = await loggedIn("unverified@kosly.dev");
  await p.post("/auth/verification/send", { channel: "email" });
  for (let i = 0; i < 4; i += 1) expectError(await p.post("/auth/verification/confirm", { code: "111111" }), 400, "verification_invalid");
  expectError(await p.post("/auth/verification/confirm", { code: "111111" }), 429, "verification_locked");
  expectError(await p.post("/auth/verification/confirm", { code: "123456" }), 429, "verification_locked");
});
S("VER-A10", "an expired code (000000) forces a resend", async () => {
  const p = await loggedIn("unverified@kosly.dev");
  await p.post("/auth/verification/send", { channel: "email" });
  expectError(await p.post("/auth/verification/confirm", { code: "000000" }), 410, "verification_expired");
  expectError(await p.post("/auth/verification/confirm", { code: "123456" }), 409, "verification_not_sent");
});
S("VER-A11", "confirming before any code was sent is a 409", async () => {
  const p = await loggedIn("unverified@kosly.dev");
  expectError(await p.post("/auth/verification/confirm", { code: "123456" }), 409, "verification_not_sent");
});
S("VER-A12", "a code that isn't six digits is a 422", async () => {
  const p = await loggedIn("unverified@kosly.dev");
  await p.post("/auth/verification/send", { channel: "email" });
  for (const bad of ["12345", "1234567", "abcdef", ""]) {
    expectError(await p.post("/auth/verification/confirm", { code: bad }), 422, "validation_failed");
  }
});
S("VER-A13", "changing the email resets the pending code; a taken or malformed email is refused", async () => {
  const p = await loggedIn("verifying@kosly.dev");
  const ok = await p.post("/auth/verification/change-email", { email: "vera.new@example.com" });
  assert.equal(ok.json.user.email, "vera.new@example.com");
  assert.equal(ok.json.user.verification, null);
  expectError(await p.post("/auth/verification/change-email", { email: "owner@kosly.dev" }), 409, "email_taken");
  assert.equal(fieldsOf(await p.post("/auth/verification/change-email", { email: "nope" })).email, "invalid");
});
S("VER-A14", "an already verified user can't start verification again", async () => {
  const p = await loggedIn("owner@kosly.dev");
  expectError(await p.post("/auth/verification/send", { channel: "email" }), 409, "already_verified");
  expectError(await p.post("/auth/verification/confirm", { code: "123456" }), 409, "already_verified");
});
S("VER-A15", "an unverified user is locked out of every verified-only endpoint", async () => {
  const p = await loggedIn("unverified@kosly.dev");
  const attempts = [
    p.get("/portfolio"),
    p.get("/kos/kos_melati"),
    p.post("/kos", { name: "X Kos", address: "a", city: "b", rooms: [{ name: "1", monthlyRent: 100000 }] }),
    p.post("/join-requests", { code: "MELATI-2K7Q", role: "tenant" }),
    p.post("/invites/inv_caretaker_ok/accept"),
    p.patch("/me", { fullName: "New Name" }),
    p.post("/billing/waitlist"),
  ];
  for (const res of await Promise.all(attempts)) expectError(res, 403, "verification_required");
});
S("VER-A16", "verification endpoints need a session", async () => {
  expectError(await person().post("/auth/verification/send", { channel: "email" }), 401, "unauthenticated");
});
S("VER-A17", "a pending code survives a fresh login, so the page can resume at the code step", async () => {
  const me = await person().login("verifying@kosly.dev");
  assert.equal(me.user.verification.channel, "email");
});

// =====================================================================================================
// ONB-O — owner setup (create kos) and the plan gate
// =====================================================================================================
const rooms = (n, rent = 800_000) => Array.from({ length: n }, (_, i) => ({ name: `Kamar ${i + 1}`, monthlyRent: rent }));
const KOS_BODY = { name: "Kos Baru", address: "Jl. Baru No. 1", city: "Jakarta", rooms: rooms(3) };

S("ONB-O-A01", "creating a kos returns its summary and adds an owner membership", async () => {
  const p = await loggedIn("owner.new@kosly.dev");
  const res = await p.post("/kos", KOS_BODY);
  assert.equal(res.status, 201);
  assert.equal(res.json.totalRooms, 3);
  assert.equal(res.json.occupiedRooms, 0);
  assert.equal(res.json.role, "owner");
  const me = (await p.get("/me")).json;
  assert.equal(me.memberships.length, 1);
  assert.equal(me.memberships[0].role, "owner");
  assert.equal(me.memberships[0].onboardingComplete, true);
});
S("ONB-O-A02", "a new kos starts with every room vacant and a join code in CODE-XXXX form", async () => {
  const p = await loggedIn("owner.new@kosly.dev");
  const { id } = (await p.post("/kos", KOS_BODY)).json;
  const detail = (await p.get(`/kos/${id}`)).json;
  assert.ok(detail.rooms.every((r) => r.status === "vacant" && r.residentName === null));
  assert.match(detail.joinCode, /^[A-Z0-9]+-[A-Z0-9]{4}$/);
});
S("ONB-O-A03", "kos name is required, at least 2 and at most 60 characters", async () => {
  const p = await loggedIn("owner.new@kosly.dev");
  assert.equal(fieldsOf(await p.post("/kos", { ...KOS_BODY, name: "  " })).name, "required");
  assert.equal(fieldsOf(await p.post("/kos", { ...KOS_BODY, name: "K" })).name, "too_short");
  assert.equal(fieldsOf(await p.post("/kos", { ...KOS_BODY, name: "K".repeat(61) })).name, "too_long");
  assert.equal((await p.post("/kos", { ...KOS_BODY, name: "K".repeat(60) })).status, 201);
});
S("ONB-O-A04", "address and city are required", async () => {
  const p = await loggedIn("owner.new@kosly.dev");
  const res = await p.post("/kos", { ...KOS_BODY, address: "", city: " " });
  assert.equal(fieldsOf(res).address, "required");
  assert.equal(fieldsOf(res).city, "required");
});
S("ONB-O-A05", "at least one room is required and at most 200 are allowed", async () => {
  const p = await loggedIn("owner.new@kosly.dev");
  assert.equal(fieldsOf(await p.post("/kos", { ...KOS_BODY, rooms: [] })).rooms, "required");
  assert.equal(fieldsOf(await p.post("/kos", { ...KOS_BODY, rooms: rooms(201) })).rooms, "too_many");
  const exactly200 = await p.post("/kos", { ...KOS_BODY, rooms: rooms(200) });
  assert.equal(exactly200.status, 201);
  assert.equal(exactly200.json.totalRooms, 200);
});
S("ONB-O-A06", "rent must be a whole number from Rp 50.000 to Rp 100.000.000", async () => {
  const p = await loggedIn("owner.new@kosly.dev");
  for (const bad of [49_999, 100_000_001, 0, -5, 850_000.5, "850000", null]) {
    const res = await p.post("/kos", { ...KOS_BODY, rooms: [{ name: "1", monthlyRent: bad }] });
    assert.equal(fieldsOf(res).rooms, "invalid_rent", `rent ${JSON.stringify(bad)}`);
  }
  for (const good of [50_000, 100_000_000]) {
    const p2 = await loggedIn("owner.pro@kosly.dev"); // pro can create repeatedly
    assert.equal((await p2.post("/kos", { ...KOS_BODY, rooms: [{ name: "1", monthlyRent: good }] })).status, 201);
  }
});
S("ONB-O-A07", "room names must be non-blank and unique (case-insensitive)", async () => {
  const p = await loggedIn("owner.new@kosly.dev");
  const dup = await p.post("/kos", { ...KOS_BODY, rooms: [{ name: "A1", monthlyRent: 800_000 }, { name: "a1", monthlyRent: 800_000 }] });
  assert.equal(fieldsOf(dup).rooms, "invalid_name");
  const blank = await p.post("/kos", { ...KOS_BODY, rooms: [{ name: " ", monthlyRent: 800_000 }] });
  assert.equal(fieldsOf(blank).rooms, "invalid_name");
});
S("ONB-O-A08", "two kos never share a join code", async () => {
  const p = await loggedIn("owner.pro@kosly.dev");
  const codes = new Set();
  for (let i = 0; i < 6; i += 1) {
    const { id } = (await p.post("/kos", { ...KOS_BODY, name: "Kos Sama" })).json;
    codes.add((await p.get(`/kos/${id}`)).json.joinCode);
  }
  assert.equal(codes.size, 6);
});
S("PLAN-A01", "free plan: an owner who already has a kos gets 402 plan_limit_reached", async () => {
  const p = await loggedIn("owner@kosly.dev");
  assert.equal((await p.get("/me")).json.canAddKos, false);
  expectError(await p.post("/kos", KOS_BODY), 402, "plan_limit_reached");
});
S("PLAN-A02", "free plan: the first kos is allowed, then the gate closes", async () => {
  const p = await loggedIn("owner.new@kosly.dev");
  assert.equal((await p.get("/me")).json.canAddKos, true);
  assert.equal((await p.post("/kos", KOS_BODY)).status, 201);
  assert.equal((await p.get("/me")).json.canAddKos, false);
  expectError(await p.post("/kos", KOS_BODY), 402, "plan_limit_reached");
});
S("PLAN-A03", "pro plan: any number of kos", async () => {
  const p = await loggedIn("owner.pro@kosly.dev");
  assert.equal((await p.get("/me")).json.canAddKos, true);
  assert.equal((await p.post("/kos", KOS_BODY)).status, 201);
  assert.equal((await p.post("/kos", KOS_BODY)).status, 201);
  assert.equal((await p.get("/portfolio")).json.length, 4);
});
S("PLAN-A04", "a downgraded owner (free plan, 2 kos) can't add more", async () => {
  const p = await loggedIn("owner.lapsed@kosly.dev");
  assert.equal((await p.get("/me")).json.canAddKos, false);
  expectError(await p.post("/kos", KOS_BODY), 402, "plan_limit_reached");
});
S("PLAN-A05", "a caretaker with no kos of their own can still create one (roles are per membership)", async () => {
  const p = await loggedIn("caretaker@kosly.dev");
  assert.equal((await p.get("/me")).json.canAddKos, true);
  assert.equal((await p.post("/kos", KOS_BODY)).status, 201);
  const roles = (await p.get("/me")).json.memberships.map((m) => m.role).sort();
  assert.deepEqual(roles, ["caretaker", "owner"]);
});
S("PLAN-A06", "joining the waitlist is idempotent; it needs a verified session", async () => {
  const p = await loggedIn("owner@kosly.dev");
  assert.equal((await p.post("/billing/waitlist")).status, 204);
  assert.equal((await p.post("/billing/waitlist")).status, 204);
  expectError(await person().post("/billing/waitlist"), 401, "unauthenticated");
});
S("PLAN-A07", "a read-only kos is flagged in /me and blocks every owner write", async () => {
  const p = await loggedIn("owner.lapsed@kosly.dev");
  const me = (await p.get("/me")).json;
  assert.equal(membershipOf(me, "kos_flamboyan").kos.readOnly, true);
  assert.equal(membershipOf(me, "kos_cempaka").kos.readOnly, false);
  expectError(await p.post("/kos/kos_flamboyan/invites", { role: "caretaker" }), 403, "kos_read_only");
  expectError(await p.post("/kos/kos_flamboyan/join-code/regenerate"), 403, "kos_read_only");
  expectError(await p.patch("/kos/kos_flamboyan/checklist", { dismissed: true }), 403, "kos_read_only");
  assert.equal((await p.get("/kos/kos_flamboyan")).status, 200, "reading stays allowed");
  assert.equal((await p.post("/kos/kos_cempaka/invites", { role: "caretaker" })).status, 201, "other kos unaffected");
});

// =====================================================================================================
// ONB-G — guest onboarding (caretaker / resident)
// =====================================================================================================
S("ONB-G-A01", "profile update saves name and phone", async () => {
  const p = await loggedIn("caretaker.new@kosly.dev"); // seeded with no phone
  const res = await p.patch("/me", { fullName: "Wati H.", phone: "081200099999" });
  assert.equal(res.json.user.fullName, "Wati H.");
  assert.equal(res.json.user.phone, "081200099999");
});
S("ONB-G-A02", "profile update rejects a blank name, a huge name and a bad phone", async () => {
  const p = await loggedIn("caretaker.new@kosly.dev");
  assert.equal(fieldsOf(await p.patch("/me", { fullName: " " })).fullName, "required");
  assert.equal(fieldsOf(await p.patch("/me", { fullName: "x".repeat(81) })).fullName, "too_long");
  assert.equal(fieldsOf(await p.patch("/me", { phone: "12" })).phone, "invalid");
});
S("ONB-G-A03", "a resident confirming their room completes onboarding without a flag", async () => {
  const tono = await loggedIn("resident.new@kosly.dev");
  const before = membershipOf((await tono.get("/me")).json, "kos_melati");
  assert.equal(before.onboardingComplete, false);
  assert.equal(before.roomName, "3A");
  const done = await tono.post(`/memberships/${before.id}/onboarding/complete`, { roomConfirmed: true });
  assert.equal(membershipOf(done.json, "kos_melati").onboardingComplete, true);
  const owner = await loggedIn("owner@kosly.dev");
  const tonoRow = (await owner.get("/kos/kos_melati")).json.residents.find((r) => r.fullName === "Tono Prasetyo");
  assert.equal(tonoRow.roomFlagged, false);
});
S("ONB-G-A04", "a resident who says the room details look wrong is flagged for the owner", async () => {
  const tono = await loggedIn("resident.new@kosly.dev");
  const m = membershipOf((await tono.get("/me")).json, "kos_melati");
  await tono.post(`/memberships/${m.id}/onboarding/complete`, { roomConfirmed: false });
  const owner = await loggedIn("owner@kosly.dev");
  const tonoRow = (await owner.get("/kos/kos_melati")).json.residents.find((r) => r.fullName === "Tono Prasetyo");
  assert.equal(tonoRow.roomFlagged, true);
});
S("ONB-G-A05", "the flag is visible to the owner only, never to a caretaker", async () => {
  const tono = await loggedIn("resident.new@kosly.dev");
  const m = membershipOf((await tono.get("/me")).json, "kos_melati");
  await tono.post(`/memberships/${m.id}/onboarding/complete`, { roomConfirmed: false });
  const sri = await loggedIn("caretaker@kosly.dev");
  const row = (await sri.get("/kos/kos_melati")).json.residents.find((r) => r.fullName === "Tono Prasetyo");
  assert.equal(row.roomFlagged, false);
});
S("ONB-G-A06", "a caretaker completes onboarding", async () => {
  const wati = await loggedIn("caretaker.new@kosly.dev");
  const m = membershipOf((await wati.get("/me")).json, "kos_melati");
  assert.equal(m.onboardingComplete, false);
  const done = await wati.post(`/memberships/${m.id}/onboarding/complete`, {});
  assert.equal(membershipOf(done.json, "kos_melati").onboardingComplete, true);
});
S("ONB-G-A07", "you can't complete someone else's onboarding", async () => {
  const tono = await loggedIn("resident.new@kosly.dev");
  const tonoMembership = membershipOf((await tono.get("/me")).json, "kos_melati");
  const lina = await loggedIn("unlinked.resident@kosly.dev");
  expectError(await lina.post(`/memberships/${tonoMembership.id}/onboarding/complete`, {}), 404, "not_found");
  expectError(await lina.post("/memberships/mem_nope/onboarding/complete", {}), 404, "not_found");
});
S("ONB-G-A08", "completing onboarding twice is harmless", async () => {
  const wati = await loggedIn("caretaker.new@kosly.dev");
  const m = membershipOf((await wati.get("/me")).json, "kos_melati");
  assert.equal((await wati.post(`/memberships/${m.id}/onboarding/complete`, {})).status, 200);
  assert.equal((await wati.post(`/memberships/${m.id}/onboarding/complete`, {})).status, 200);
});

// =====================================================================================================
// INV — invite links
// =====================================================================================================
S("INV-A01", "an invite can be previewed without logging in", async () => {
  const res = await person().get("/invites/inv_tenant_ok");
  assert.equal(res.status, 200);
  assert.deepEqual(res.json, {
    kosName: "Kos Melati",
    city: "Yogyakarta",
    ownerName: "Budi Santoso",
    role: "tenant",
    roomName: "1A",
    status: "active",
  });
});
S("INV-A02", "preview reports each unusable state instead of erroring, and 404s an unknown token", async () => {
  const expected = { inv_expired: "expired", inv_revoked: "revoked", inv_used: "used" };
  for (const [token, status] of Object.entries(expected)) {
    assert.equal((await person().get(`/invites/${token}`)).json.status, status);
  }
  expectError(await person().get("/invites/inv_nope"), 404, "invite_not_found");
});
S("INV-A03", "accepting a caretaker invite creates a membership that still needs onboarding", async () => {
  const lina = await loggedIn("unlinked.resident@kosly.dev");
  const res = await lina.post("/invites/inv_caretaker_ok/accept");
  assert.equal(res.status, 200);
  assert.equal(res.json.kosId, "kos_melati");
  const m = membershipOf(res.json.me, "kos_melati");
  assert.equal(m.role, "caretaker");
  assert.equal(m.onboardingComplete, false);
});
S("INV-A04", "an invite is single-use", async () => {
  const lina = await loggedIn("unlinked.resident@kosly.dev");
  await lina.post("/invites/inv_caretaker_ok/accept");
  const fajar = await loggedIn("pending.caretaker@kosly.dev");
  expectError(await fajar.post("/invites/inv_caretaker_ok/accept"), 409, "invite_used");
  assert.equal((await person().get("/invites/inv_caretaker_ok")).json.status, "used");
});
S("INV-A05", "accepting a resident invite puts them in the invited room and marks it occupied", async () => {
  const lina = await loggedIn("unlinked.resident@kosly.dev");
  const res = await lina.post("/invites/inv_tenant_ok/accept");
  const m = membershipOf(res.json.me, "kos_melati");
  assert.equal(m.role, "tenant");
  assert.equal(m.roomName, "1A");
  const owner = await loggedIn("owner@kosly.dev");
  const room = (await owner.get("/kos/kos_melati")).json.rooms.find((r) => r.name === "1A");
  assert.equal(room.status, "due");
  assert.equal(room.residentName, "Lina Marlina");
});
S("INV-A06", "expired, revoked, used and unknown tokens are refused on accept", async () => {
  const lina = await loggedIn("unlinked.resident@kosly.dev");
  expectError(await lina.post("/invites/inv_expired/accept"), 410, "invite_expired");
  expectError(await lina.post("/invites/inv_revoked/accept"), 410, "invite_revoked");
  expectError(await lina.post("/invites/inv_used/accept"), 409, "invite_used");
  expectError(await lina.post("/invites/inv_nope/accept"), 404, "invite_not_found");
});
S("INV-A07", "someone already in that kos can't accept another invite to it", async () => {
  const sri = await loggedIn("caretaker@kosly.dev");
  expectError(await sri.post("/invites/inv_caretaker_ok/accept"), 409, "already_member");
  const owner = await loggedIn("owner@kosly.dev");
  expectError(await owner.post("/invites/inv_caretaker_ok/accept"), 409, "already_member");
});
S("INV-A08", "a resident invite for a room that got occupied meanwhile is refused", async () => {
  const lina = await loggedIn("unlinked.resident@kosly.dev");
  expectError(await lina.post("/invites/inv_tenant_taken/accept"), 409, "room_taken");
});
S("INV-A09", "accepting needs a verified session", async () => {
  expectError(await person().post("/invites/inv_caretaker_ok/accept"), 401, "unauthenticated");
  const yoga = await loggedIn("unverified@kosly.dev");
  expectError(await yoga.post("/invites/inv_caretaker_ok/accept"), 403, "verification_required");
});
S("INV-A10", "an existing caretaker can accept an invite from a second, unrelated owner (multi-kos)", async () => {
  const sri = await loggedIn("caretaker@kosly.dev");
  const res = await sri.post("/invites/inv_anggrek_caretaker/accept");
  assert.equal(res.status, 200);
  const me = res.json.me;
  assert.equal(me.memberships.length, 2);
  assert.deepEqual(me.memberships.map((m) => m.kos.ownerName).sort(), ["Budi Santoso", "Hendra Wijaya"]);
});
S("INV-A11", "accepting an invite cancels the person's pending join request to the same kos", async () => {
  const dewi = await loggedIn("pending@kosly.dev");
  assert.equal((await dewi.get("/me")).json.joinRequests.length, 1);
  await dewi.post("/invites/inv_caretaker_ok/accept");
  assert.equal((await dewi.get("/me")).json.joinRequests.length, 0);
});
S("INV-A12", "an owner creates a caretaker invite that expires in 7 days", async () => {
  const owner = await loggedIn("owner@kosly.dev");
  const res = await owner.post("/kos/kos_melati/invites", { role: "caretaker" });
  assert.equal(res.status, 201);
  assert.equal(res.json.role, "caretaker");
  assert.equal(res.json.status, "active");
  const days = (new Date(res.json.expiresAt) - Date.now()) / 86_400_000;
  assert.ok(days > 6.9 && days <= 7.01, `expires in ${days} days`);
  assert.equal((await person().get(`/invites/${res.json.token}`)).json.status, "active");
});
S("INV-A13", "every created invite has its own unguessable token", async () => {
  const owner = await loggedIn("owner@kosly.dev");
  const a = (await owner.post("/kos/kos_melati/invites", { role: "caretaker" })).json.token;
  const b = (await owner.post("/kos/kos_melati/invites", { role: "caretaker" })).json.token;
  assert.notEqual(a, b);
  assert.ok(a.length >= 20);
});
S("INV-A14", "a resident invite needs a vacant room of the same kos", async () => {
  const owner = await loggedIn("owner@kosly.dev");
  assert.equal(fieldsOf(await owner.post("/kos/kos_melati/invites", { role: "tenant" })).roomId, "required");
  assert.equal(fieldsOf(await owner.post("/kos/kos_melati/invites", { role: "tenant", roomId: "room_nope" })).roomId, "invalid");
  assert.equal(fieldsOf(await owner.post("/kos/kos_melati/invites", { role: "tenant", roomId: "room_anggrek_2" })).roomId, "invalid");
  assert.equal(fieldsOf(await owner.post("/kos/kos_melati/invites", { role: "tenant", roomId: "room_melati_2a" })).roomId, "occupied");
  assert.equal((await owner.post("/kos/kos_melati/invites", { role: "tenant", roomId: "room_melati_1a" })).status, 201);
});
S("INV-A15", "you can't invite someone as an owner", async () => {
  const owner = await loggedIn("owner@kosly.dev");
  assert.equal(fieldsOf(await owner.post("/kos/kos_melati/invites", { role: "owner" })).role, "invalid");
});
S("INV-A16", "only that kos's owner can create invites", async () => {
  const sri = await loggedIn("caretaker@kosly.dev");
  expectError(await sri.post("/kos/kos_melati/invites", { role: "caretaker" }), 403, "forbidden");
  const ditta = await loggedIn("resident@kosly.dev");
  expectError(await ditta.post("/kos/kos_melati/invites", { role: "caretaker" }), 403, "forbidden");
  const hendra = await loggedIn("owner.pro@kosly.dev");
  expectError(await hendra.post("/kos/kos_melati/invites", { role: "caretaker" }), 404, "not_found");
});
S("INV-A17", "an owner can revoke an active invite; the link then reads as revoked", async () => {
  const owner = await loggedIn("owner@kosly.dev");
  assert.equal((await owner.del("/kos/kos_melati/invites/invite_inv_caretaker_ok")).status, 204);
  assert.equal((await person().get("/invites/inv_caretaker_ok")).json.status, "revoked");
  const lina = await loggedIn("unlinked.resident@kosly.dev");
  expectError(await lina.post("/invites/inv_caretaker_ok/accept"), 410, "invite_revoked");
});
S("INV-A18", "revoking an invite that's no longer active is a 409", async () => {
  const owner = await loggedIn("owner@kosly.dev");
  expectError(await owner.del("/kos/kos_melati/invites/invite_inv_used"), 409, "invite_not_active");
  expectError(await owner.del("/kos/kos_melati/invites/invite_inv_revoked"), 409, "invite_not_active");
  expectError(await owner.del("/kos/kos_melati/invites/invite_inv_expired"), 409, "invite_not_active");
  expectError(await owner.del("/kos/kos_melati/invites/invite_missing"), 404, "not_found");
});
S("INV-A19", "the owner's list shows each invite with its current status", async () => {
  const owner = await loggedIn("owner@kosly.dev");
  const invites = (await owner.get("/kos/kos_melati")).json.invites;
  const byToken = Object.fromEntries(invites.map((i) => [i.token, i.status]));
  assert.equal(byToken.inv_caretaker_ok, "active");
  assert.equal(byToken.inv_expired, "expired");
  assert.equal(byToken.inv_revoked, "revoked");
  assert.equal(byToken.inv_used, "used");
  assert.equal(invites.find((i) => i.token === "inv_tenant_ok").roomName, "1A");
});

// =====================================================================================================
// JOIN — join by code, owner approval
// =====================================================================================================
S("JOIN-A01", "a valid code creates a pending request the requester can see", async () => {
  const lina = await loggedIn("unlinked.resident@kosly.dev");
  const res = await lina.post("/join-requests", { code: "MELATI-2K7Q", role: "tenant" });
  assert.equal(res.status, 201);
  assert.equal(res.json.joinRequests.length, 1);
  assert.equal(res.json.joinRequests[0].kosName, "Kos Melati");
  assert.equal(res.json.joinRequests[0].status, "pending");
  assert.equal(res.json.memberships.length, 0, "not a member until approved");
});
S("JOIN-A02", "the code is forgiving: any case, spaces, missing dash", async () => {
  for (const typed of ["melati-2k7q", " MELATI 2K7Q ", "melati2k7q"]) {
    await person().post("/__mock/reset");
    const lina = await loggedIn("unlinked.resident@kosly.dev");
    assert.equal((await lina.post("/join-requests", { code: typed, role: "tenant" })).status, 201, typed);
  }
});
S("JOIN-A03", "an unknown code is a 404, an empty one a 422", async () => {
  const lina = await loggedIn("unlinked.resident@kosly.dev");
  expectError(await lina.post("/join-requests", { code: "NOPE-0000", role: "tenant" }), 404, "code_not_found");
  assert.equal(fieldsOf(await lina.post("/join-requests", { code: "   ", role: "tenant" })).code, "required");
});
S("JOIN-A04", "the requested role must be resident or caretaker", async () => {
  const lina = await loggedIn("unlinked.resident@kosly.dev");
  assert.equal(fieldsOf(await lina.post("/join-requests", { code: "MELATI-2K7Q", role: "owner" })).role, "invalid");
  assert.equal(fieldsOf(await lina.post("/join-requests", { code: "MELATI-2K7Q" })).role, "invalid");
});
S("JOIN-A05", "a second request to the same kos while one is pending is a 409", async () => {
  const dewi = await loggedIn("pending@kosly.dev");
  expectError(await dewi.post("/join-requests", { code: "MELATI-2K7Q", role: "tenant" }), 409, "request_exists");
});
S("JOIN-A06", "an existing member can't request to join their own kos", async () => {
  const ditta = await loggedIn("resident@kosly.dev");
  expectError(await ditta.post("/join-requests", { code: "MELATI-2K7Q", role: "tenant" }), 409, "already_member");
  const owner = await loggedIn("owner@kosly.dev");
  expectError(await owner.post("/join-requests", { code: "MELATI-2K7Q", role: "caretaker" }), 409, "already_member");
});
S("JOIN-A07", "the owner sees waiting requests, and the count is in /me", async () => {
  const owner = await loggedIn("owner@kosly.dev");
  const me = (await owner.get("/me")).json;
  assert.equal(membershipOf(me, "kos_melati").pendingRequestCount, 2);
  const pending = (await owner.get("/kos/kos_melati")).json.pendingRequests;
  assert.deepEqual(pending.map((r) => r.fullName).sort(), ["Dewi Anggraini", "Fajar Nugroho"]);
  assert.equal(pending.find((r) => r.fullName === "Dewi Anggraini").email, "pending@kosly.dev");
});
S("JOIN-A08", "approving a caretaker request creates the membership, still needing onboarding", async () => {
  const owner = await loggedIn("owner@kosly.dev");
  assert.equal((await owner.post("/kos/kos_melati/join-requests/jr_fajar/approve")).status, 204);
  const fajar = await loggedIn("pending.caretaker@kosly.dev");
  const me = (await fajar.get("/me")).json;
  const m = membershipOf(me, "kos_melati");
  assert.equal(m.role, "caretaker");
  assert.equal(m.onboardingComplete, false);
  assert.equal(me.joinRequests.length, 0);
  assert.equal(membershipOf((await owner.get("/me")).json, "kos_melati").pendingRequestCount, 1);
});
S("JOIN-A09", "approving a resident request needs a vacant room from the same kos", async () => {
  const owner = await loggedIn("owner@kosly.dev");
  const url = "/kos/kos_melati/join-requests/jr_dewi/approve";
  assert.equal(fieldsOf(await owner.post(url, {})).roomId, "required");
  assert.equal(fieldsOf(await owner.post(url, { roomId: "room_nope" })).roomId, "invalid");
  assert.equal(fieldsOf(await owner.post(url, { roomId: "room_anggrek_2" })).roomId, "invalid");
  expectError(await owner.post(url, { roomId: "room_melati_2a" }), 409, "room_taken");
  assert.equal((await owner.post(url, { roomId: "room_melati_1a" })).status, 204);
  const dewi = await loggedIn("pending@kosly.dev");
  const m = membershipOf((await dewi.get("/me")).json, "kos_melati");
  assert.equal(m.roomName, "1A");
  const room = (await owner.get("/kos/kos_melati")).json.rooms.find((r) => r.name === "1A");
  assert.equal(room.status, "due");
});
S("JOIN-A10", "rejecting shows the requester a rejected state, and they may ask again", async () => {
  const owner = await loggedIn("owner@kosly.dev");
  assert.equal((await owner.post("/kos/kos_melati/join-requests/jr_fajar/reject")).status, 204);
  const fajar = await loggedIn("pending.caretaker@kosly.dev");
  const me = (await fajar.get("/me")).json;
  assert.equal(me.memberships.length, 0);
  assert.equal(me.joinRequests[0].status, "rejected");
  const again = await fajar.post("/join-requests", { code: "MELATI-2K7Q", role: "caretaker" });
  assert.equal(again.status, 201);
  assert.equal(again.json.joinRequests.length, 1, "only the newest request per kos is shown");
  assert.equal(again.json.joinRequests[0].status, "pending");
});
S("JOIN-A11", "a request that was already decided can't be decided again", async () => {
  const owner = await loggedIn("owner@kosly.dev");
  await owner.post("/kos/kos_melati/join-requests/jr_fajar/approve");
  expectError(await owner.post("/kos/kos_melati/join-requests/jr_fajar/reject"), 409, "request_already_decided");
  expectError(await owner.post("/kos/kos_melati/join-requests/jr_bayu/approve"), 409, "request_already_decided");
});
S("JOIN-A12", "only the owner decides: caretaker/resident get 403, another owner gets 404", async () => {
  const sri = await loggedIn("caretaker@kosly.dev");
  expectError(await sri.post("/kos/kos_melati/join-requests/jr_fajar/approve"), 403, "forbidden");
  const ditta = await loggedIn("resident@kosly.dev");
  expectError(await ditta.post("/kos/kos_melati/join-requests/jr_fajar/reject"), 403, "forbidden");
  const hendra = await loggedIn("owner.pro@kosly.dev");
  expectError(await hendra.post("/kos/kos_melati/join-requests/jr_fajar/approve"), 404, "not_found");
});
S("JOIN-A13", "a request id from another kos can't be decided through this kos", async () => {
  const hendra = await loggedIn("owner.pro@kosly.dev");
  expectError(await hendra.post("/kos/kos_anggrek/join-requests/jr_fajar/approve"), 404, "not_found");
});
S("JOIN-A14", "a requester can cancel their own pending request, and only that", async () => {
  const dewi = await loggedIn("pending@kosly.dev");
  const fajar = await loggedIn("pending.caretaker@kosly.dev");
  expectError(await fajar.del("/join-requests/jr_dewi"), 404, "not_found");
  assert.equal((await dewi.del("/join-requests/jr_dewi")).status, 204);
  assert.equal((await dewi.get("/me")).json.joinRequests.length, 0);
  const bayu = await loggedIn("rejected@kosly.dev");
  expectError(await bayu.del("/join-requests/jr_bayu"), 404, "not_found");
});
S("JOIN-A15", "regenerating the join code kills the old one and the new one works", async () => {
  const owner = await loggedIn("owner@kosly.dev");
  const res = await owner.post("/kos/kos_melati/join-code/regenerate");
  assert.equal(res.status, 200);
  assert.notEqual(res.json.joinCode, "MELATI-2K7Q");
  const lina = await loggedIn("unlinked.resident@kosly.dev");
  expectError(await lina.post("/join-requests", { code: "MELATI-2K7Q", role: "tenant" }), 404, "code_not_found");
  assert.equal((await lina.post("/join-requests", { code: res.json.joinCode, role: "tenant" })).status, 201);
});
S("JOIN-A16", "only the owner can regenerate the join code", async () => {
  const sri = await loggedIn("caretaker@kosly.dev");
  expectError(await sri.post("/kos/kos_melati/join-code/regenerate"), 403, "forbidden");
});
S("JOIN-A17", "a read-only kos can't approve or reject (the write guard runs before the lookup)", async () => {
  const p = await loggedIn("owner.lapsed@kosly.dev");
  expectError(await p.post("/kos/kos_flamboyan/join-requests/jr_x/approve"), 403, "kos_read_only");
  expectError(await p.post("/kos/kos_flamboyan/join-requests/jr_x/reject"), 403, "kos_read_only");
});

// =====================================================================================================
// APP — what each role can see
// =====================================================================================================
S("APP-A01", "owner detail carries owner-only data", async () => {
  const d = (await (await loggedIn("owner@kosly.dev")).get("/kos/kos_melati")).json;
  assert.equal(d.role, "owner");
  assert.equal(d.joinCode, "MELATI-2K7Q");
  assert.ok(Array.isArray(d.invites) && Array.isArray(d.pendingRequests) && d.checklist);
  assert.equal(d.rooms.length, 7);
});
S("APP-A02", "caretaker detail has rooms and residents but none of the owner-only data", async () => {
  const d = (await (await loggedIn("caretaker@kosly.dev")).get("/kos/kos_melati")).json;
  assert.equal(d.role, "caretaker");
  assert.equal(d.rooms.length, 7);
  assert.ok(d.residents.length > 0);
  for (const key of ["joinCode", "invites", "pendingRequests", "checklist", "myRoom"]) assert.equal(d[key], undefined, key);
});
S("APP-A03", "resident detail exposes only their own room and the caretakers, never other residents", async () => {
  const d = (await (await loggedIn("resident@kosly.dev")).get("/kos/kos_melati")).json;
  assert.equal(d.role, "tenant");
  assert.deepEqual(d.rooms, []);
  assert.deepEqual(d.residents, []);
  assert.equal(d.myRoom.name, "4B");
  assert.equal(d.myRoom.monthlyRent, 850_000);
  assert.equal(d.myRoom.status, "paid");
  assert.equal(d.myRoom.payments.length, 2);
  assert.ok(d.myRoom.payments[0].paidAt > d.myRoom.payments[1].paidAt, "newest payment first");
  assert.ok(d.caretakers.length > 0);
  for (const key of ["joinCode", "invites", "pendingRequests", "checklist"]) assert.equal(d[key], undefined, key);
});
S("APP-A04", "a kos you're not in is a 404 (not 403), so ids can't be probed", async () => {
  const ditta = await loggedIn("resident@kosly.dev");
  expectError(await ditta.get("/kos/kos_anggrek"), 404, "not_found");
  expectError(await ditta.get("/kos/kos_nope"), 404, "not_found");
});
S("APP-A05", "the portfolio lists every kos the person belongs to, with the owner's name", async () => {
  const hendra = (await (await loggedIn("owner.pro@kosly.dev")).get("/portfolio")).json;
  assert.deepEqual(hendra.map((k) => k.name).sort(), ["Kos Anggrek", "Kos Dahlia"]);
  const agus = (await (await loggedIn("caretaker.multi@kosly.dev")).get("/portfolio")).json;
  assert.deepEqual(agus.map((k) => k.ownerName).sort(), ["Budi Santoso", "Hendra Wijaya"]);
  assert.ok(agus.every((k) => k.role === "caretaker"));
});
S("APP-A06", "the stats add up: Kos Melati", async () => {
  const k = (await (await loggedIn("owner@kosly.dev")).get("/portfolio")).json[0];
  assert.equal(k.totalRooms, 7);
  assert.equal(k.occupiedRooms, 6);
  assert.equal(k.expectedRent, 5_100_000);
  assert.equal(k.collectedRent, 2_550_000);
  assert.equal(k.overdueCount, 1);
});
S("APP-A07", "a brand-new owner sees an empty checklist state that reacts to invites", async () => {
  const p = await loggedIn("owner.new@kosly.dev");
  const { id } = (await p.post("/kos", KOS_BODY)).json;
  const items = () => p.get(`/kos/${id}`).then((r) => Object.fromEntries(r.json.checklist.items.map((i) => [i.key, i.done])));
  assert.deepEqual(await items(), { setupKos: true, inviteCaretaker: false, inviteResident: false });
  await p.post(`/kos/${id}/invites`, { role: "caretaker" });
  assert.deepEqual(await items(), { setupKos: true, inviteCaretaker: true, inviteResident: false });
  const roomId = (await p.get(`/kos/${id}`)).json.rooms[0].id;
  await p.post(`/kos/${id}/invites`, { role: "tenant", roomId });
  assert.deepEqual(await items(), { setupKos: true, inviteCaretaker: true, inviteResident: true });
});
S("APP-A08", "a revoked invite no longer counts toward the checklist", async () => {
  const p = await loggedIn("owner.new@kosly.dev");
  const { id } = (await p.post("/kos", KOS_BODY)).json;
  const invite = (await p.post(`/kos/${id}/invites`, { role: "caretaker" })).json;
  await p.del(`/kos/${id}/invites/${invite.id}`);
  const items = (await p.get(`/kos/${id}`)).json.checklist.items;
  assert.equal(items.find((i) => i.key === "inviteCaretaker").done, false);
});
S("APP-A09", "the owner can hide the checklist; nobody else can", async () => {
  const owner = await loggedIn("owner@kosly.dev");
  assert.equal((await owner.get("/kos/kos_melati")).json.checklist.dismissed, false);
  assert.equal((await owner.patch("/kos/kos_melati/checklist", { dismissed: true })).status, 204);
  assert.equal((await owner.get("/kos/kos_melati")).json.checklist.dismissed, true);
  const sri = await loggedIn("caretaker@kosly.dev");
  expectError(await sri.patch("/kos/kos_melati/checklist", { dismissed: true }), 403, "forbidden");
});
S("APP-A10", "a newly approved resident shows up in the owner's people list with their room", async () => {
  const owner = await loggedIn("owner@kosly.dev");
  await owner.post("/kos/kos_melati/join-requests/jr_dewi/approve", { roomId: "room_melati_1a" });
  const dewi = (await owner.get("/kos/kos_melati")).json.residents.find((r) => r.fullName === "Dewi Anggraini");
  assert.equal(dewi.roomName, "1A");
});
S("APP-A11", "data endpoints need a session", async () => {
  for (const path of ["/portfolio", "/kos/kos_melati", "/me"]) expectError(await person().get(path), 401, "unauthenticated");
});
S("APP-A12", "the same person can hold different roles in different kos", async () => {
  const agus = (await (await loggedIn("caretaker.multi@kosly.dev")).get("/me")).json;
  assert.equal(agus.memberships.length, 2);
  assert.ok(agus.memberships.every((m) => m.onboardingComplete));
  const hendra = await loggedIn("owner.pro@kosly.dev");
  await hendra.post("/invites/inv_caretaker_ok/accept");
  const me = (await hendra.get("/me")).json;
  assert.deepEqual(me.memberships.map((m) => m.role).sort(), ["caretaker", "owner", "owner"]);
});

S("APP-A13", "a resident never receives kos-wide money or room counts, in the portfolio or the detail", async () => {
  const ditta = await loggedIn("resident@kosly.dev");
  const summary = (await ditta.get("/portfolio")).json[0];
  const detail = (await ditta.get("/kos/kos_melati")).json;
  for (const dto of [summary, detail]) {
    assert.deepEqual(
      [dto.totalRooms, dto.occupiedRooms, dto.expectedRent, dto.collectedRent, dto.overdueCount, dto.pendingRequestCount],
      [0, 0, 0, 0, 0, 0],
    );
  }
  assert.equal(detail.myRoom.monthlyRent, 850_000, "their own rent is still there");
});

// =====================================================================================================
// SEC — protocol level
// =====================================================================================================
S("SEC-A01", "the session cookie is HttpOnly, SameSite=Lax and site-wide", async () => {
  const cookie = (await person().post("/auth/login", { email: "owner@kosly.dev", password: PASSWORD })).setCookies[0];
  for (const flag of [/HttpOnly/, /SameSite=Lax/, /Path=\//]) assert.match(cookie, flag);
});
S("SEC-A02", "the response body never contains a password or the session token", async () => {
  const res = await person().post("/auth/login", { email: "owner@kosly.dev", password: PASSWORD });
  assert.doesNotMatch(res.text, /Kosly1234|password|ses_/i);
});
S("SEC-A03", "an unknown path is a 404 and a wrong verb is a 405", async () => {
  expectError(await person().get("/nope"), 404, "not_found");
  expectError(await person().get("/auth/login"), 405, "method_not_allowed");
  // Verbs the route file doesn't export (PUT) are answered by Next itself with a bare 405.
  assert.equal((await person().call("PUT", "/me", {})).status, 405);
});
S("SEC-A04", "no endpoint leaks another person's data through the invite preview", async () => {
  const res = await person().get("/invites/inv_tenant_ok");
  assert.deepEqual(Object.keys(res.json).sort(), ["city", "kosName", "ownerName", "role", "roomName", "status"]);
});

// =====================================================================================================
// Runner
// =====================================================================================================
async function main() {
  try {
    const ping = await fetch(`${BASE}/api/v1/__mock/reset`, { method: "POST" });
    if (ping.status === 404) {
      console.error(`Mock API is off at ${BASE}. Start the dev server with KOSLY_MOCK_API=true (see .env.example).`);
      process.exit(2);
    }
  } catch {
    console.error(`Can't reach ${BASE}. Start the dev server first (npm run dev).`);
    process.exit(2);
  }

  const selected = scenarios.filter((s) => !only || s.id.startsWith(only));
  let failed = 0;
  for (const scenario of selected) {
    await fetch(`${BASE}/api/v1/__mock/reset`, { method: "POST" });
    try {
      await scenario.fn();
      console.log(`  PASS  ${scenario.id.padEnd(10)} ${scenario.title}`);
    } catch (error) {
      failed += 1;
      console.log(`  FAIL  ${scenario.id.padEnd(10)} ${scenario.title}`);
      console.log(`        ${String(error.message).split("\n").join("\n        ")}`);
    }
  }
  await fetch(`${BASE}/api/v1/__mock/reset`, { method: "POST" });
  console.log(`\n${selected.length - failed}/${selected.length} API scenarios passed`);
  process.exit(failed ? 1 : 0);
}

main();
