import type {
  ApiErrorBody,
  ChecklistDto,
  InviteDto,
  InvitePreviewDto,
  InviteStatus,
  KosDetailDto,
  KosSummaryDto,
  MeDto,
  MembershipDto,
  PersonDto,
  RoomDto,
  VerificationChannel,
} from "@/lib/api-types";
import { isJoinableRole, isRole } from "@/lib/roles";
import {
  type Db,
  type DbInvite,
  type DbKos,
  type DbMembership,
  type DbRoom,
  type DbUser,
  INVITE_TTL_DAYS,
  LOGIN_LOCK_SECONDS,
  LOGIN_MAX_FAILURES,
  MOCK_OTP_EXPIRED,
  MOCK_OTP_VALID,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_SECONDS,
  getDb,
  nextId,
  resetDb,
} from "./db";

const SESSION_COOKIE = "kosly_session";
const DAY_MS = 24 * 60 * 60 * 1000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\s-]{8,15}$/;

class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly extra: Partial<ApiErrorBody["error"]> = {},
  ) {
    super(code);
  }
}

function invalid(fields: Record<string, string>): never {
  throw new HttpError(422, "validation_failed", { fields });
}

interface Reply {
  status: number;
  data?: unknown;
  setCookie?: string;
}

interface Ctx {
  db: Db;
  req: Request;
  params: Record<string, string>;
  body: Record<string, unknown>;
  user: DbUser | null;
  sessionToken: string | null;
}

type Auth = "none" | "user" | "verified";

interface Route {
  method: string;
  segments: string[];
  auth: Auth;
  handler: (ctx: Ctx) => Reply;
}

// ---------------------------------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------------------------------

const iso = (ms: number) => new Date(ms).toISOString();

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return null;
}

function sessionCookie(token: string, maxAgeSeconds?: number): string {
  const parts = [`${SESSION_COOKIE}=${token}`, "Path=/", "HttpOnly", "SameSite=Lax"];
  if (maxAgeSeconds !== undefined) parts.push(`Max-Age=${maxAgeSeconds}`);
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

function newToken(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
function randomCode(length: number): string {
  let out = "";
  for (let i = 0; i < length; i += 1) out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return out;
}

function normalizeCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function makeJoinCode(db: Db, name: string): string {
  const base = name.toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^KOS/, "").slice(0, 10) || "KOS";
  for (;;) {
    const code = `${base}-${randomCode(4)}`;
    if (!db.kos.some((k) => normalizeCode(k.joinCode) === normalizeCode(code))) return code;
  }
}

function ownerOf(db: Db, kos: DbKos): DbUser {
  return db.users.find((u) => u.id === kos.ownerId)!;
}

function inviteStatus(invite: DbInvite): InviteStatus {
  if (invite.revoked) return "revoked";
  if (invite.usedByUserId) return "used";
  if (invite.expiresAt < Date.now()) return "expired";
  return "active";
}

function residentName(db: Db, room: DbRoom): string | null {
  if (room.membershipId) {
    const membership = db.memberships.find((m) => m.id === room.membershipId);
    const user = membership && db.users.find((u) => u.id === membership.userId);
    return user?.fullName ?? room.residentLabel;
  }
  return room.residentLabel;
}

// ---------------------------------------------------------------------------------------------------
// DTO builders
// ---------------------------------------------------------------------------------------------------

function pendingRequestCount(db: Db, kosId: string): number {
  return db.joinRequests.filter((r) => r.kosId === kosId && r.status === "pending").length;
}

function canAddKos(db: Db, user: DbUser): boolean {
  if (user.plan === "pro") return true;
  return !db.kos.some((k) => k.ownerId === user.id);
}

function buildMe(db: Db, user: DbUser): MeDto {
  const memberships: MembershipDto[] = db.memberships
    .filter((m) => m.userId === user.id)
    .map((m) => {
      const kos = db.kos.find((k) => k.id === m.kosId)!;
      const room = m.roomId ? db.rooms.find((r) => r.id === m.roomId) : undefined;
      return {
        id: m.id,
        role: m.role,
        kos: {
          id: kos.id,
          name: kos.name,
          city: kos.city,
          ownerName: ownerOf(db, kos).fullName,
          readOnly: kos.readOnly,
        },
        roomId: m.roomId,
        roomName: room?.name ?? null,
        onboardingComplete: m.onboardingComplete,
        pendingRequestCount: m.role === "owner" ? pendingRequestCount(db, kos.id) : 0,
      };
    });

  // One entry per kos: the newest request wins, and approved requests are already memberships.
  const latestByKos = new Map<string, (typeof db.joinRequests)[number]>();
  for (const request of db.joinRequests.filter((r) => r.userId === user.id && r.status !== "approved")) {
    const existing = latestByKos.get(request.kosId);
    if (!existing || existing.createdAt < request.createdAt) latestByKos.set(request.kosId, request);
  }

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      intent: user.intent,
      plan: user.plan,
      verified: user.verified,
      verification: user.verification
        ? { channel: user.verification.channel, resendAvailableAt: iso(user.verification.resendAvailableAt) }
        : null,
    },
    memberships,
    joinRequests: [...latestByKos.values()].map((r) => ({
      id: r.id,
      kosName: db.kos.find((k) => k.id === r.kosId)!.name,
      role: r.role,
      status: r.status as "pending" | "rejected",
      createdAt: iso(r.createdAt),
    })),
    canAddKos: canAddKos(db, user),
  };
}

function summarize(db: Db, kos: DbKos, role: MembershipDto["role"]): KosSummaryDto {
  const base = {
    id: kos.id,
    name: kos.name,
    address: kos.address,
    city: kos.city,
    ownerName: ownerOf(db, kos).fullName,
    role,
    readOnly: kos.readOnly,
  };
  // A resident must never see other people's rent, so the kos-wide numbers are zeroed for them.
  if (role === "tenant") {
    return { ...base, totalRooms: 0, occupiedRooms: 0, expectedRent: 0, collectedRent: 0, overdueCount: 0, pendingRequestCount: 0 };
  }
  const rooms = db.rooms.filter((r) => r.kosId === kos.id);
  const occupied = rooms.filter((r) => r.status !== "vacant");
  return {
    ...base,
    totalRooms: rooms.length,
    occupiedRooms: occupied.length,
    expectedRent: occupied.reduce((sum, r) => sum + r.monthlyRent, 0),
    collectedRent: rooms.filter((r) => r.status === "paid").reduce((sum, r) => sum + r.monthlyRent, 0),
    overdueCount: rooms.filter((r) => r.status === "overdue").length,
    pendingRequestCount: role === "owner" ? pendingRequestCount(db, kos.id) : 0,
  };
}

function toRoomDto(db: Db, room: DbRoom): RoomDto {
  return {
    id: room.id,
    name: room.name,
    monthlyRent: room.monthlyRent,
    status: room.status,
    residentName: residentName(db, room),
  };
}

function toPerson(db: Db, membership: DbMembership, includeFlag: boolean): PersonDto {
  const user = db.users.find((u) => u.id === membership.userId)!;
  const room = membership.roomId ? db.rooms.find((r) => r.id === membership.roomId) : undefined;
  return {
    membershipId: membership.id,
    fullName: user.fullName,
    phone: user.phone,
    roomName: room?.name ?? null,
    roomFlagged: includeFlag && membership.roomFlagged,
  };
}

function toInviteDto(db: Db, invite: DbInvite): InviteDto {
  const room = invite.roomId ? db.rooms.find((r) => r.id === invite.roomId) : undefined;
  return {
    id: invite.id,
    token: invite.token,
    role: invite.role,
    roomName: room?.name ?? null,
    status: inviteStatus(invite),
    expiresAt: iso(invite.expiresAt),
    createdAt: iso(invite.createdAt),
  };
}

function buildChecklist(db: Db, kos: DbKos): ChecklistDto {
  const members = db.memberships.filter((m) => m.kosId === kos.id);
  const invites = db.invites.filter((i) => i.kosId === kos.id && !i.revoked);
  return {
    dismissed: kos.checklistDismissed,
    items: [
      { key: "setupKos", done: true },
      {
        key: "inviteCaretaker",
        done: members.some((m) => m.role === "caretaker") || invites.some((i) => i.role === "caretaker"),
      },
      {
        key: "inviteResident",
        done: members.some((m) => m.role === "tenant") || invites.some((i) => i.role === "tenant"),
      },
    ],
  };
}

const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name, "en", { numeric: true });

function buildKosDetail(db: Db, kos: DbKos, membership: DbMembership): KosDetailDto {
  const role = membership.role;
  const summary = summarize(db, kos, role);
  const roomRows = db.rooms.filter((r) => r.kosId === kos.id).sort(byName);
  const members = db.memberships.filter((m) => m.kosId === kos.id);
  const caretakers = members.filter((m) => m.role === "caretaker").map((m) => toPerson(db, m, false));
  const residents = members
    .filter((m) => m.role === "tenant")
    .map((m) => toPerson(db, m, role === "owner"));

  // A resident only sees their own room and who to contact, never other residents or their rent.
  if (role === "tenant") {
    const room = membership.roomId ? db.rooms.find((r) => r.id === membership.roomId) : undefined;
    return {
      ...summary,
      rooms: [],
      residents: [],
      caretakers: caretakers.map((c) => ({ ...c })),
      myRoom: room
        ? {
            name: room.name,
            monthlyRent: room.monthlyRent,
            dueDay: 1,
            status: room.status,
            payments: db.payments
              .filter((p) => p.roomId === room.id)
              .sort((a, b) => b.paidAt - a.paidAt)
              .map((p) => ({ id: p.id, amount: p.amount, paidAt: iso(p.paidAt), loggedBy: p.loggedBy })),
          }
        : undefined,
    };
  }

  const detail: KosDetailDto = {
    ...summary,
    rooms: roomRows.map((r) => toRoomDto(db, r)),
    caretakers,
    residents,
  };

  if (role === "owner") {
    detail.joinCode = kos.joinCode;
    detail.invites = db.invites
      .filter((i) => i.kosId === kos.id)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((i) => toInviteDto(db, i));
    detail.pendingRequests = db.joinRequests
      .filter((r) => r.kosId === kos.id && r.status === "pending")
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((r) => {
        const requester = db.users.find((u) => u.id === r.userId)!;
        return {
          id: r.id,
          fullName: requester.fullName,
          email: requester.email,
          role: r.role,
          createdAt: iso(r.createdAt),
        };
      });
    detail.checklist = buildChecklist(db, kos);
  }
  return detail;
}

// ---------------------------------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------------------------------

function need<T>(value: T | null | undefined, error: HttpError): T {
  if (value === null || value === undefined) throw error;
  return value;
}

const notFound = () => new HttpError(404, "not_found");

/** Membership of the signed-in user in a kos. A miss is a 404 so kos ids can't be probed. */
function membershipFor(ctx: Ctx, kosId: string): DbMembership {
  return need(
    ctx.db.memberships.find((m) => m.userId === ctx.user!.id && m.kosId === kosId),
    notFound(),
  );
}

function ownedKos(ctx: Ctx, kosId: string, options: { write: boolean }): DbKos {
  const membership = membershipFor(ctx, kosId);
  if (membership.role !== "owner") throw new HttpError(403, "forbidden");
  const kos = need(
    ctx.db.kos.find((k) => k.id === kosId),
    notFound(),
  );
  if (options.write && kos.readOnly) throw new HttpError(403, "kos_read_only");
  return kos;
}

// ---------------------------------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------------------------------

function validateEmail(email: string): void {
  if (!email) invalid({ email: "required" });
  if (!EMAIL_PATTERN.test(email)) invalid({ email: "invalid" });
}

function startSession(db: Db, user: DbUser, remember: boolean): Reply {
  const token = newToken("ses");
  const ttl = remember ? 30 * DAY_MS : DAY_MS;
  db.sessions.set(token, { token, userId: user.id, expiresAt: Date.now() + ttl });
  return { status: 200, data: buildMe(db, user), setCookie: sessionCookie(token, remember ? ttl / 1000 : undefined) };
}

function register(ctx: Ctx): Reply {
  const { db, body } = ctx;
  const fullName = str(body.fullName);
  const email = str(body.email).toLowerCase();
  const phone = str(body.phone);
  const password = typeof body.password === "string" ? body.password : "";
  const inviteToken = str(body.inviteToken);

  const fields: Record<string, string> = {};
  if (!fullName) fields.fullName = "required";
  if (!email) fields.email = "required";
  else if (!EMAIL_PATTERN.test(email)) fields.email = "invalid";
  if (phone && !PHONE_PATTERN.test(phone)) fields.phone = "invalid";
  if (password.length < 8) fields.password = "too_short";
  if (!isRole(body.intent)) fields.intent = "invalid";
  if (Object.keys(fields).length > 0) invalid(fields);

  let intent = body.intent as DbUser["intent"];
  if (inviteToken) {
    const invite = need(
      db.invites.find((i) => i.token === inviteToken),
      new HttpError(404, "invite_not_found"),
    );
    assertInviteUsable(invite);
    intent = invite.role;
  }

  if (db.users.some((u) => u.email === email)) throw new HttpError(409, "email_taken");

  const user: DbUser = {
    id: nextId(db, "usr"),
    fullName,
    email,
    phone: phone || null,
    password,
    intent,
    plan: "free",
    verified: false,
    verification: null,
    failedLogins: 0,
    lockedUntil: 0,
  };
  db.users.push(user);
  return { ...startSession(db, user, false), status: 201 };
}

function login(ctx: Ctx): Reply {
  const { db, body } = ctx;
  const email = str(body.email).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) invalid({ [!email ? "email" : "password"]: "required" });

  const user = db.users.find((u) => u.email === email);
  if (user && user.lockedUntil > Date.now()) {
    throw new HttpError(429, "too_many_attempts", {
      retryAfterSeconds: Math.ceil((user.lockedUntil - Date.now()) / 1000),
    });
  }
  if (!user || user.password !== password) {
    if (user) {
      user.failedLogins += 1;
      if (user.failedLogins >= LOGIN_MAX_FAILURES) {
        user.lockedUntil = Date.now() + LOGIN_LOCK_SECONDS * 1000;
        user.failedLogins = 0;
      }
    }
    throw new HttpError(401, "invalid_credentials");
  }
  user.failedLogins = 0;
  return startSession(db, user, body.rememberMe === true);
}

function logout(ctx: Ctx): Reply {
  if (ctx.sessionToken) ctx.db.sessions.delete(ctx.sessionToken);
  return { status: 204, setCookie: `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0` };
}

function me(ctx: Ctx): Reply {
  return { status: 200, data: buildMe(ctx.db, ctx.user!) };
}

function updateMe(ctx: Ctx): Reply {
  const user = ctx.user!;
  const fields: Record<string, string> = {};
  const fullName = ctx.body.fullName === undefined ? user.fullName : str(ctx.body.fullName);
  if (!fullName) fields.fullName = "required";
  else if (fullName.length > 80) fields.fullName = "too_long";
  let phone = user.phone;
  if (ctx.body.phone !== undefined) {
    const next = str(ctx.body.phone);
    if (next && !PHONE_PATTERN.test(next)) fields.phone = "invalid";
    phone = next || null;
  }
  if (Object.keys(fields).length > 0) invalid(fields);
  user.fullName = fullName;
  user.phone = phone;
  return me(ctx);
}

function sendVerification(ctx: Ctx): Reply {
  const user = ctx.user!;
  if (user.verified) throw new HttpError(409, "already_verified");
  const channel = ctx.body.channel;
  if (channel !== "email" && channel !== "whatsapp") invalid({ channel: "invalid" });

  let phone = user.phone;
  if (channel === "whatsapp") {
    const supplied = str(ctx.body.phone);
    if (supplied) {
      if (!PHONE_PATTERN.test(supplied)) invalid({ phone: "invalid" });
      phone = supplied;
    }
    if (!phone) invalid({ phone: "required" });
  }

  const now = Date.now();
  if (user.verification && user.verification.resendAvailableAt > now) {
    throw new HttpError(429, "verification_cooldown", {
      retryAfterSeconds: Math.ceil((user.verification.resendAvailableAt - now) / 1000),
    });
  }
  user.phone = phone;
  user.verification = {
    channel: channel as VerificationChannel,
    code: MOCK_OTP_VALID,
    resendAvailableAt: now + OTP_RESEND_SECONDS * 1000,
    attempts: 0,
  };
  return me(ctx);
}

function confirmVerification(ctx: Ctx): Reply {
  const user = ctx.user!;
  if (user.verified) throw new HttpError(409, "already_verified");
  const pending = need(user.verification, new HttpError(409, "verification_not_sent"));
  const code = str(ctx.body.code);
  if (!/^\d{6}$/.test(code)) invalid({ code: "invalid" });

  if (pending.attempts >= OTP_MAX_ATTEMPTS) throw new HttpError(429, "verification_locked");
  if (code === MOCK_OTP_EXPIRED) {
    user.verification = null;
    throw new HttpError(410, "verification_expired");
  }
  if (code !== pending.code) {
    pending.attempts += 1;
    if (pending.attempts >= OTP_MAX_ATTEMPTS) throw new HttpError(429, "verification_locked");
    throw new HttpError(400, "verification_invalid", { attemptsLeft: OTP_MAX_ATTEMPTS - pending.attempts });
  }
  user.verified = true;
  user.verification = null;
  return me(ctx);
}

function changeEmail(ctx: Ctx): Reply {
  const user = ctx.user!;
  if (user.verified) throw new HttpError(409, "already_verified");
  const email = str(ctx.body.email).toLowerCase();
  validateEmail(email);
  if (db_emailTaken(ctx.db, email, user.id)) throw new HttpError(409, "email_taken");
  user.email = email;
  user.verification = null;
  return me(ctx);
}

function db_emailTaken(db: Db, email: string, exceptUserId: string): boolean {
  return db.users.some((u) => u.email === email && u.id !== exceptUserId);
}

function createKos(ctx: Ctx): Reply {
  const { db, body } = ctx;
  const user = ctx.user!;
  const name = str(body.name);
  const address = str(body.address);
  const city = str(body.city);
  const rooms = Array.isArray(body.rooms) ? (body.rooms as unknown[]) : [];

  const fields: Record<string, string> = {};
  if (!name) fields.name = "required";
  else if (name.length < 2) fields.name = "too_short";
  else if (name.length > 60) fields.name = "too_long";
  if (!address) fields.address = "required";
  if (!city) fields.city = "required";
  if (rooms.length === 0) fields.rooms = "required";
  else if (rooms.length > 200) fields.rooms = "too_many";
  else {
    const seen = new Set<string>();
    for (const raw of rooms) {
      const row = (raw ?? {}) as Record<string, unknown>;
      const roomName = str(row.name);
      const rent = row.monthlyRent;
      if (!roomName || seen.has(roomName.toLowerCase())) {
        fields.rooms = "invalid_name";
        break;
      }
      seen.add(roomName.toLowerCase());
      if (typeof rent !== "number" || !Number.isInteger(rent) || rent < 50_000 || rent > 100_000_000) {
        fields.rooms = "invalid_rent";
        break;
      }
    }
  }
  if (Object.keys(fields).length > 0) invalid(fields);
  if (!canAddKos(db, user)) throw new HttpError(402, "plan_limit_reached");

  const kos: DbKos = {
    id: nextId(db, "kos"),
    ownerId: user.id,
    name,
    address,
    city,
    joinCode: makeJoinCode(db, name),
    readOnly: false,
    checklistDismissed: false,
  };
  db.kos.push(kos);
  const membership: DbMembership = {
    id: nextId(db, "mem"),
    userId: user.id,
    kosId: kos.id,
    role: "owner",
    roomId: null,
    onboardingComplete: true,
    roomFlagged: false,
  };
  db.memberships.push(membership);
  for (const raw of rooms) {
    const row = raw as { name: string; monthlyRent: number };
    db.rooms.push({
      id: nextId(db, "room"),
      kosId: kos.id,
      name: str(row.name),
      monthlyRent: row.monthlyRent,
      status: "vacant",
      membershipId: null,
      residentLabel: null,
    });
  }
  return { status: 201, data: summarize(db, kos, "owner") };
}

function portfolio(ctx: Ctx): Reply {
  const { db } = ctx;
  const list = db.memberships
    .filter((m) => m.userId === ctx.user!.id)
    .map((m) => summarize(db, db.kos.find((k) => k.id === m.kosId)!, m.role));
  return { status: 200, data: list };
}

function kosDetail(ctx: Ctx): Reply {
  const membership = membershipFor(ctx, ctx.params.kosId);
  const kos = need(
    ctx.db.kos.find((k) => k.id === ctx.params.kosId),
    notFound(),
  );
  return { status: 200, data: buildKosDetail(ctx.db, kos, membership) };
}

function createInvite(ctx: Ctx): Reply {
  const { db, body } = ctx;
  const kos = ownedKos(ctx, ctx.params.kosId, { write: true });
  if (!isJoinableRole(body.role)) invalid({ role: "invalid" });
  const role = body.role as DbInvite["role"];
  let roomId: string | null = null;
  if (role === "tenant") {
    const requested = str(body.roomId);
    if (!requested) invalid({ roomId: "required" });
    const room = db.rooms.find((r) => r.id === requested && r.kosId === kos.id);
    if (!room) invalid({ roomId: "invalid" });
    if (room!.status !== "vacant") invalid({ roomId: "occupied" });
    roomId = requested;
  }
  const now = Date.now();
  const invite: DbInvite = {
    id: nextId(db, "invite"),
    token: newToken("inv"),
    kosId: kos.id,
    role,
    roomId,
    revoked: false,
    usedByUserId: null,
    expiresAt: now + INVITE_TTL_DAYS * DAY_MS,
    createdAt: now,
  };
  db.invites.push(invite);
  return { status: 201, data: toInviteDto(db, invite) };
}

function revokeInvite(ctx: Ctx): Reply {
  const kos = ownedKos(ctx, ctx.params.kosId, { write: true });
  const invite = need(
    ctx.db.invites.find((i) => i.id === ctx.params.inviteId && i.kosId === kos.id),
    notFound(),
  );
  if (inviteStatus(invite) !== "active") throw new HttpError(409, "invite_not_active");
  invite.revoked = true;
  return { status: 204 };
}

function regenerateJoinCode(ctx: Ctx): Reply {
  const kos = ownedKos(ctx, ctx.params.kosId, { write: true });
  kos.joinCode = makeJoinCode(ctx.db, kos.name);
  return { status: 200, data: { joinCode: kos.joinCode } };
}

function dismissChecklist(ctx: Ctx): Reply {
  const kos = ownedKos(ctx, ctx.params.kosId, { write: true });
  kos.checklistDismissed = ctx.body.dismissed !== false;
  return { status: 204 };
}

function decideRequest(approve: boolean) {
  return (ctx: Ctx): Reply => {
    const { db } = ctx;
    const kos = ownedKos(ctx, ctx.params.kosId, { write: true });
    const request = need(
      db.joinRequests.find((r) => r.id === ctx.params.requestId && r.kosId === kos.id),
      notFound(),
    );
    if (request.status !== "pending") throw new HttpError(409, "request_already_decided");

    if (!approve) {
      request.status = "rejected";
      return { status: 204 };
    }

    let room: DbRoom | undefined;
    if (request.role === "tenant") {
      const roomId = str(ctx.body.roomId);
      if (!roomId) invalid({ roomId: "required" });
      room = db.rooms.find((r) => r.id === roomId && r.kosId === kos.id);
      if (!room) invalid({ roomId: "invalid" });
      if (room!.status !== "vacant" || room!.membershipId) throw new HttpError(409, "room_taken");
    }
    const membership: DbMembership = {
      id: nextId(db, "mem"),
      userId: request.userId,
      kosId: kos.id,
      role: request.role,
      roomId: room?.id ?? null,
      onboardingComplete: false,
      roomFlagged: false,
    };
    db.memberships.push(membership);
    if (room) {
      room.membershipId = membership.id;
      room.status = "due";
    }
    request.status = "approved";
    return { status: 204 };
  };
}

function assertInviteUsable(invite: DbInvite): void {
  const status = inviteStatus(invite);
  if (status === "revoked") throw new HttpError(410, "invite_revoked");
  if (status === "expired") throw new HttpError(410, "invite_expired");
  if (status === "used") throw new HttpError(409, "invite_used");
}

function previewInvite(ctx: Ctx): Reply {
  const { db } = ctx;
  const invite = need(
    db.invites.find((i) => i.token === ctx.params.token),
    new HttpError(404, "invite_not_found"),
  );
  const kos = db.kos.find((k) => k.id === invite.kosId)!;
  const room = invite.roomId ? db.rooms.find((r) => r.id === invite.roomId) : undefined;
  const preview: InvitePreviewDto = {
    kosName: kos.name,
    city: kos.city,
    ownerName: ownerOf(db, kos).fullName,
    role: invite.role,
    roomName: room?.name ?? null,
    status: inviteStatus(invite),
  };
  return { status: 200, data: preview };
}

function acceptInvite(ctx: Ctx): Reply {
  const { db } = ctx;
  const user = ctx.user!;
  const invite = need(
    db.invites.find((i) => i.token === ctx.params.token),
    new HttpError(404, "invite_not_found"),
  );
  assertInviteUsable(invite);
  const kos = db.kos.find((k) => k.id === invite.kosId)!;
  if (db.memberships.some((m) => m.userId === user.id && m.kosId === kos.id)) {
    throw new HttpError(409, "already_member");
  }

  let room: DbRoom | undefined;
  if (invite.role === "tenant") {
    room = db.rooms.find((r) => r.id === invite.roomId);
    if (!room || room.status !== "vacant" || room.membershipId) throw new HttpError(409, "room_taken");
  }
  const membership: DbMembership = {
    id: nextId(db, "mem"),
    userId: user.id,
    kosId: kos.id,
    role: invite.role,
    roomId: room?.id ?? null,
    onboardingComplete: false,
    roomFlagged: false,
  };
  db.memberships.push(membership);
  if (room) {
    room.membershipId = membership.id;
    room.status = "due";
  }
  invite.usedByUserId = user.id;
  // A pending join request to the same kos is now moot.
  db.joinRequests = db.joinRequests.filter(
    (r) => !(r.userId === user.id && r.kosId === kos.id && r.status === "pending"),
  );
  return { status: 200, data: { kosId: kos.id, me: buildMe(db, user) } };
}

function createJoinRequest(ctx: Ctx): Reply {
  const { db, body } = ctx;
  const user = ctx.user!;
  const code = normalizeCode(str(body.code));
  if (!code) invalid({ code: "required" });
  if (!isJoinableRole(body.role)) invalid({ role: "invalid" });

  const kos = need(
    db.kos.find((k) => normalizeCode(k.joinCode) === code),
    new HttpError(404, "code_not_found"),
  );
  if (db.memberships.some((m) => m.userId === user.id && m.kosId === kos.id)) {
    throw new HttpError(409, "already_member");
  }
  if (db.joinRequests.some((r) => r.userId === user.id && r.kosId === kos.id && r.status === "pending")) {
    throw new HttpError(409, "request_exists");
  }
  db.joinRequests.push({
    id: nextId(db, "jr"),
    userId: user.id,
    kosId: kos.id,
    role: body.role as DbInvite["role"],
    status: "pending",
    createdAt: Date.now(),
  });
  return { status: 201, data: buildMe(db, user) };
}

function cancelJoinRequest(ctx: Ctx): Reply {
  const { db } = ctx;
  const request = need(
    db.joinRequests.find(
      (r) => r.id === ctx.params.requestId && r.userId === ctx.user!.id && r.status === "pending",
    ),
    notFound(),
  );
  db.joinRequests = db.joinRequests.filter((r) => r.id !== request.id);
  return { status: 204 };
}

function completeOnboarding(ctx: Ctx): Reply {
  const { db, body } = ctx;
  const membership = need(
    db.memberships.find((m) => m.id === ctx.params.membershipId && m.userId === ctx.user!.id),
    notFound(),
  );
  if (membership.role === "tenant" && body.roomConfirmed === false) membership.roomFlagged = true;
  membership.onboardingComplete = true;
  return me(ctx);
}

function joinWaitlist(ctx: Ctx): Reply {
  ctx.db.waitlist.add(ctx.user!.id);
  return { status: 204 };
}

function mockReset(): Reply {
  resetDb();
  return { status: 204 };
}

// ---------------------------------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------------------------------

const route = (method: string, path: string, auth: Auth, handler: Route["handler"]): Route => ({
  method,
  segments: path.split("/"),
  auth,
  handler,
});

const ROUTES: Route[] = [
  route("POST", "auth/register", "none", register),
  route("POST", "auth/login", "none", login),
  route("POST", "auth/logout", "none", logout),
  route("GET", "me", "user", me),
  route("PATCH", "me", "verified", updateMe),
  route("POST", "auth/verification/send", "user", sendVerification),
  route("POST", "auth/verification/confirm", "user", confirmVerification),
  route("POST", "auth/verification/change-email", "user", changeEmail),
  route("POST", "kos", "verified", createKos),
  route("GET", "portfolio", "verified", portfolio),
  route("GET", "kos/:kosId", "verified", kosDetail),
  route("POST", "kos/:kosId/invites", "verified", createInvite),
  route("DELETE", "kos/:kosId/invites/:inviteId", "verified", revokeInvite),
  route("POST", "kos/:kosId/join-code/regenerate", "verified", regenerateJoinCode),
  route("PATCH", "kos/:kosId/checklist", "verified", dismissChecklist),
  route("POST", "kos/:kosId/join-requests/:requestId/approve", "verified", decideRequest(true)),
  route("POST", "kos/:kosId/join-requests/:requestId/reject", "verified", decideRequest(false)),
  route("GET", "invites/:token", "none", previewInvite),
  route("POST", "invites/:token/accept", "verified", acceptInvite),
  route("POST", "join-requests", "verified", createJoinRequest),
  route("DELETE", "join-requests/:requestId", "verified", cancelJoinRequest),
  route("POST", "memberships/:membershipId/onboarding/complete", "verified", completeOnboarding),
  route("POST", "billing/waitlist", "verified", joinWaitlist),
  route("POST", "__mock/reset", "none", mockReset),
];

function matchRoute(method: string, path: string[]): { route: Route; params: Record<string, string> } | null {
  for (const candidate of ROUTES) {
    if (candidate.method !== method || candidate.segments.length !== path.length) continue;
    const params: Record<string, string> = {};
    const ok = candidate.segments.every((segment, index) => {
      if (segment.startsWith(":")) {
        params[segment.slice(1)] = decodeURIComponent(path[index]);
        return true;
      }
      return segment === path[index];
    });
    if (ok) return { route: candidate, params };
  }
  return null;
}

function errorResponse(status: number, code: string, extra: Partial<ApiErrorBody["error"]> = {}): Response {
  const body: ApiErrorBody = { error: { code, message: code, ...extra } };
  return Response.json(body, { status });
}

export async function handleMockRequest(req: Request, path: string[]): Promise<Response> {
  const found = matchRoute(req.method, path);
  if (!found) {
    // A known path with the wrong verb is a 405, everything else a 404.
    const knownPath = ROUTES.some(
      (r) => r.segments.length === path.length && r.segments.every((s, i) => s.startsWith(":") || s === path[i]),
    );
    return errorResponse(knownPath ? 405 : 404, knownPath ? "method_not_allowed" : "not_found");
  }

  const db = getDb();
  let body: Record<string, unknown> = {};
  if (req.method === "POST" || req.method === "PATCH") {
    const text = await req.text();
    if (text) {
      try {
        const parsed: unknown = JSON.parse(text);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) body = parsed as Record<string, unknown>;
        else return errorResponse(400, "bad_request");
      } catch {
        return errorResponse(400, "bad_request");
      }
    }
  }

  const sessionToken = readCookie(req, SESSION_COOKIE);
  const session = sessionToken ? db.sessions.get(sessionToken) : undefined;
  const user =
    session && session.expiresAt > Date.now() ? (db.users.find((u) => u.id === session.userId) ?? null) : null;

  try {
    if (found.route.auth !== "none") {
      if (!user) throw new HttpError(401, "unauthenticated");
      if (found.route.auth === "verified" && !user.verified) throw new HttpError(403, "verification_required");
    }
    const reply = found.route.handler({
      db,
      req,
      params: found.params,
      body,
      user,
      sessionToken: session ? sessionToken : null,
    });
    const headers = new Headers();
    if (reply.setCookie) headers.append("Set-Cookie", reply.setCookie);
    if (reply.status === 204) return new Response(null, { status: 204, headers });
    headers.set("Content-Type", "application/json");
    return new Response(JSON.stringify(reply.data ?? {}), { status: reply.status, headers });
  } catch (error) {
    if (error instanceof HttpError) return errorResponse(error.status, error.code, error.extra);
    throw error;
  }
}
