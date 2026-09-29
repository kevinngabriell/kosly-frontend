import type { Plan, RoomStatus, VerificationChannel } from "@/lib/api-types";
import type { JoinableRole, Role } from "@/lib/roles";

/**
 * DEV-ONLY in-memory fake of the Kosly backend. Nothing here is a real security control: passwords are
 * plain, the "OTP" is a fixed code, and state lives in module memory (reset on server restart or via
 * POST /api/v1/__mock/reset). It exists so the frontend flows can be built and tested before the real
 * PHP API does. Served only when KOSLY_MOCK_API=true (see app/api/v1/[...path]/route.ts).
 */

export const MOCK_PASSWORD = "Kosly1234!";
export const MOCK_OTP_VALID = "123456";
export const MOCK_OTP_EXPIRED = "000000";
export const OTP_RESEND_SECONDS = 60;
export const OTP_MAX_ATTEMPTS = 5;
export const LOGIN_MAX_FAILURES = 5;
export const LOGIN_LOCK_SECONDS = 15 * 60;
export const INVITE_TTL_DAYS = 7;

export interface DbUser {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  password: string;
  intent: Role;
  plan: Plan;
  verified: boolean;
  verification: {
    channel: VerificationChannel;
    code: string;
    resendAvailableAt: number;
    attempts: number;
  } | null;
  failedLogins: number;
  lockedUntil: number;
}

export interface DbKos {
  id: string;
  ownerId: string;
  name: string;
  address: string;
  city: string;
  joinCode: string;
  readOnly: boolean;
  checklistDismissed: boolean;
}

export interface DbRoom {
  id: string;
  kosId: string;
  name: string;
  monthlyRent: number;
  status: RoomStatus;
  /** Set when the resident has a Kosly account. */
  membershipId: string | null;
  /** Display name for a resident who has no Kosly account (seed filler / offline residents). */
  residentLabel: string | null;
}

export interface DbMembership {
  id: string;
  userId: string;
  kosId: string;
  role: Role;
  roomId: string | null;
  onboardingComplete: boolean;
  roomFlagged: boolean;
}

export interface DbInvite {
  id: string;
  token: string;
  kosId: string;
  role: JoinableRole;
  roomId: string | null;
  revoked: boolean;
  usedByUserId: string | null;
  expiresAt: number;
  createdAt: number;
}

export interface DbJoinRequest {
  id: string;
  userId: string;
  kosId: string;
  role: JoinableRole;
  status: "pending" | "approved" | "rejected";
  createdAt: number;
}

export interface DbPayment {
  id: string;
  kosId: string;
  roomId: string;
  amount: number;
  paidAt: number;
  loggedBy: string;
}

export interface DbSession {
  token: string;
  userId: string;
  expiresAt: number;
}

export interface Db {
  users: DbUser[];
  kos: DbKos[];
  rooms: DbRoom[];
  memberships: DbMembership[];
  invites: DbInvite[];
  joinRequests: DbJoinRequest[];
  payments: DbPayment[];
  sessions: Map<string, DbSession>;
  waitlist: Set<string>;
  seq: number;
}

const globalForDb = globalThis as unknown as { __koslyMockDb?: Db };

export function getDb(): Db {
  return (globalForDb.__koslyMockDb ??= seed());
}

export function resetDb(): Db {
  globalForDb.__koslyMockDb = seed();
  return globalForDb.__koslyMockDb;
}

export function nextId(db: Db, prefix: string): string {
  db.seq += 1;
  return `${prefix}_${db.seq}`;
}

const DAY = 24 * 60 * 60 * 1000;

function seed(): Db {
  const now = Date.now();
  const db: Db = {
    users: [],
    kos: [],
    rooms: [],
    memberships: [],
    invites: [],
    joinRequests: [],
    payments: [],
    sessions: new Map(),
    waitlist: new Set(),
    seq: 1000,
  };

  const user = (
    id: string,
    fullName: string,
    email: string,
    phone: string | null,
    intent: Role,
    extra: Partial<DbUser> = {},
  ) => {
    db.users.push({
      id,
      fullName,
      email,
      phone,
      password: MOCK_PASSWORD,
      intent,
      plan: "free",
      verified: true,
      verification: null,
      failedLogins: 0,
      lockedUntil: 0,
      ...extra,
    });
  };

  const kos = (id: string, ownerId: string, name: string, address: string, city: string, joinCode: string, readOnly = false) => {
    db.kos.push({ id, ownerId, name, address, city, joinCode, readOnly, checklistDismissed: false });
    db.memberships.push({
      id: `mem_owner_${id}`,
      userId: ownerId,
      kosId: id,
      role: "owner",
      roomId: null,
      onboardingComplete: true,
      roomFlagged: false,
    });
  };

  const room = (
    id: string,
    kosId: string,
    name: string,
    monthlyRent: number,
    status: RoomStatus,
    residentLabel: string | null = null,
    membershipId: string | null = null,
  ) => {
    db.rooms.push({ id, kosId, name, monthlyRent, status, membershipId, residentLabel });
  };

  const member = (
    id: string,
    userId: string,
    kosId: string,
    role: Role,
    roomId: string | null,
    onboardingComplete = true,
  ) => {
    db.memberships.push({ id, userId, kosId, role, roomId, onboardingComplete, roomFlagged: false });
  };

  const invite = (token: string, kosId: string, role: JoinableRole, roomId: string | null, extra: Partial<DbInvite> = {}) => {
    db.invites.push({
      id: `invite_${token}`,
      token,
      kosId,
      role,
      roomId,
      revoked: false,
      usedByUserId: null,
      expiresAt: now + INVITE_TTL_DAYS * DAY,
      createdAt: now - DAY,
      ...extra,
    });
  };

  // --- People (all share MOCK_PASSWORD; see docs/mock-accounts.md) -------------------------------
  user("usr_budi", "Budi Santoso", "owner@kosly.dev", "081234567890", "owner");
  user("usr_ditta", "Ditta Amelia", "resident@kosly.dev", "081298765432", "tenant");
  user("usr_sri", "Sri Wahyuni", "caretaker@kosly.dev", "081345678901", "caretaker");
  user("usr_hendra", "Hendra Wijaya", "owner.pro@kosly.dev", "081311112222", "owner", { plan: "pro" });
  user("usr_agus", "Agus Setiawan", "caretaker.multi@kosly.dev", "081322223333", "caretaker");
  user("usr_rina", "Rina Kusuma", "owner.new@kosly.dev", "081333334444", "owner");
  user("usr_tono", "Tono Prasetyo", "resident.new@kosly.dev", "081344445555", "tenant");
  user("usr_wati", "Wati Handayani", "caretaker.new@kosly.dev", null, "caretaker");
  user("usr_yoga", "Yoga Pratama", "unverified@kosly.dev", null, "owner", { verified: false });
  user("usr_verifying", "Vera Anindita", "verifying@kosly.dev", "081355556666", "tenant", {
    verified: false,
    verification: {
      channel: "email",
      code: MOCK_OTP_VALID,
      resendAvailableAt: now + OTP_RESEND_SECONDS * 1000,
      attempts: 0,
    },
  });
  user("usr_lina", "Lina Marlina", "unlinked.resident@kosly.dev", "081366667777", "tenant");
  user("usr_dewi", "Dewi Anggraini", "pending@kosly.dev", "081377778888", "tenant");
  user("usr_fajar", "Fajar Nugroho", "pending.caretaker@kosly.dev", "081388889999", "caretaker");
  user("usr_bayu", "Bayu Saputra", "rejected@kosly.dev", "081399990000", "caretaker");
  user("usr_maya", "Maya Sari", "owner.lapsed@kosly.dev", "081300001111", "owner");
  user("usr_lock", "Lock Tester", "lock@kosly.dev", "081300002222", "owner");

  // --- Kos Melati (Budi, free plan, 1 kos) -------------------------------------------------------
  kos("kos_melati", "usr_budi", "Kos Melati", "Jl. Kenanga No. 12", "Yogyakarta", "MELATI-2K7Q");
  room("room_melati_1a", "kos_melati", "1A", 800_000, "vacant");
  room("room_melati_1b", "kos_melati", "1B", 800_000, "paid", "Andi Pratama");
  room("room_melati_2a", "kos_melati", "2A", 850_000, "due", "Siti Rahma");
  room("room_melati_2b", "kos_melati", "2B", 850_000, "overdue", "Rudi Hartono");
  room("room_melati_3a", "kos_melati", "3A", 850_000, "due", null, "mem_tono");
  room("room_melati_4a", "kos_melati", "4A", 900_000, "paid", "Maya Lestari");
  room("room_melati_4b", "kos_melati", "4B", 850_000, "paid", null, "mem_ditta");
  member("mem_ditta", "usr_ditta", "kos_melati", "tenant", "room_melati_4b");
  member("mem_tono", "usr_tono", "kos_melati", "tenant", "room_melati_3a", false);
  member("mem_sri", "usr_sri", "kos_melati", "caretaker", null);
  member("mem_wati", "usr_wati", "kos_melati", "caretaker", null, false);
  member("mem_agus_melati", "usr_agus", "kos_melati", "caretaker", null);
  db.payments.push(
    { id: "pay_ditta_now", kosId: "kos_melati", roomId: "room_melati_4b", amount: 850_000, paidAt: now - 2 * 60 * 60 * 1000, loggedBy: "Sri Wahyuni" },
    { id: "pay_ditta_prev", kosId: "kos_melati", roomId: "room_melati_4b", amount: 850_000, paidAt: now - 31 * DAY, loggedBy: "Sri Wahyuni" },
  );

  // --- Hendra (pro plan, 2 kos, different city each) ---------------------------------------------
  kos("kos_anggrek", "usr_hendra", "Kos Anggrek", "Jl. Dago No. 8", "Bandung", "ANGGREK-9M3X");
  room("room_anggrek_1", "kos_anggrek", "A1", 1_200_000, "paid", "Kevin Halim");
  room("room_anggrek_2", "kos_anggrek", "A2", 1_200_000, "vacant");
  room("room_anggrek_3", "kos_anggrek", "A3", 1_300_000, "due", "Tania Putri");
  kos("kos_dahlia", "usr_hendra", "Kos Dahlia", "Jl. Malioboro No. 45", "Yogyakarta", "DAHLIA-4P8W");
  room("room_dahlia_1", "kos_dahlia", "D1", 700_000, "overdue", "Eko Susilo");
  room("room_dahlia_2", "kos_dahlia", "D2", 700_000, "vacant");
  member("mem_agus_anggrek", "usr_agus", "kos_anggrek", "caretaker", null);

  // --- Maya: downgraded owner. Cempaka stays editable, Flamboyan is read-only -----------------
  kos("kos_cempaka", "usr_maya", "Kos Cempaka", "Jl. Diponegoro No. 3", "Semarang", "CEMPAKA-5T6R");
  room("room_cempaka_1", "kos_cempaka", "C1", 650_000, "paid", "Nina Safitri");
  room("room_cempaka_2", "kos_cempaka", "C2", 650_000, "vacant");
  kos("kos_flamboyan", "usr_maya", "Kos Flamboyan", "Jl. Pandanaran No. 21", "Semarang", "FLAMBOYAN-8V2B", true);
  room("room_flamboyan_1", "kos_flamboyan", "F1", 600_000, "due", "Galih Permana");

  // --- Join requests waiting on Budi -------------------------------------------------------------
  db.joinRequests.push(
    { id: "jr_dewi", userId: "usr_dewi", kosId: "kos_melati", role: "tenant", status: "pending", createdAt: now - 3 * 60 * 60 * 1000 },
    { id: "jr_fajar", userId: "usr_fajar", kosId: "kos_melati", role: "caretaker", status: "pending", createdAt: now - DAY },
    { id: "jr_bayu", userId: "usr_bayu", kosId: "kos_melati", role: "caretaker", status: "rejected", createdAt: now - 4 * DAY },
  );

  // --- Invites (fixed tokens so scenarios can link straight to /invite/<token>) -------------------
  invite("inv_caretaker_ok", "kos_melati", "caretaker", null);
  invite("inv_tenant_ok", "kos_melati", "tenant", "room_melati_1a");
  invite("inv_tenant_taken", "kos_melati", "tenant", "room_melati_2a");
  invite("inv_anggrek_caretaker", "kos_anggrek", "caretaker", null);
  invite("inv_expired", "kos_melati", "caretaker", null, { expiresAt: now - DAY, createdAt: now - 9 * DAY });
  invite("inv_revoked", "kos_melati", "caretaker", null, { revoked: true });
  invite("inv_used", "kos_melati", "tenant", "room_melati_4b", { usedByUserId: "usr_ditta" });

  return db;
}
