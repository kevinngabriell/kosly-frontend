import type { JoinableRole, Role } from "./roles";

/**
 * Wire types for the Kosly API (`/api/v1`). Shared by the frontend and the dev mock backend, and the
 * source of truth that `kosly-api-requirements.md` describes for the real backend.
 */

export type Plan = "free" | "pro";
export type VerificationChannel = "email" | "whatsapp";
export type RoomStatus = "vacant" | "paid" | "due" | "overdue";
export type InviteStatus = "active" | "used" | "expired" | "revoked";

export interface UserDto {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  /** What the person said they came to do at register time. Steers onboarding only, grants nothing. */
  intent: Role;
  plan: Plan;
  /** True once one channel (email or WhatsApp) was confirmed. Nothing else works before that. */
  verified: boolean;
  /** Present while a code is outstanding, so a page reload can resume at the "enter code" step. */
  verification: { channel: VerificationChannel; resendAvailableAt: string } | null;
}

export interface MembershipDto {
  id: string;
  role: Role;
  kos: { id: string; name: string; city: string; ownerName: string; readOnly: boolean };
  roomId: string | null;
  roomName: string | null;
  onboardingComplete: boolean;
  /** Owner memberships only: join requests waiting for a decision. */
  pendingRequestCount: number;
}

export interface JoinRequestDto {
  id: string;
  kosName: string;
  role: JoinableRole;
  status: "pending" | "rejected";
  createdAt: string;
}

export interface MeDto {
  user: UserDto;
  memberships: MembershipDto[];
  joinRequests: JoinRequestDto[];
  /** False on the free plan once the person already owns a kos. */
  canAddKos: boolean;
}

export interface RoomDto {
  id: string;
  name: string;
  monthlyRent: number;
  status: RoomStatus;
  residentName: string | null;
}

export interface PersonDto {
  membershipId: string;
  fullName: string;
  phone: string | null;
  roomName: string | null;
  /** The resident said the room or rent details looked wrong during onboarding. */
  roomFlagged: boolean;
}

export interface PaymentDto {
  id: string;
  amount: number;
  paidAt: string;
  loggedBy: string;
}

export interface InviteDto {
  id: string;
  token: string;
  role: JoinableRole;
  roomName: string | null;
  status: InviteStatus;
  expiresAt: string;
  createdAt: string;
}

export interface PendingRequestDto {
  id: string;
  fullName: string;
  email: string;
  role: JoinableRole;
  createdAt: string;
}

export interface ChecklistDto {
  dismissed: boolean;
  items: { key: "setupKos" | "inviteCaretaker" | "inviteResident"; done: boolean }[];
}

export interface KosSummaryDto {
  id: string;
  name: string;
  address: string;
  city: string;
  ownerName: string;
  role: Role;
  readOnly: boolean;
  totalRooms: number;
  occupiedRooms: number;
  expectedRent: number;
  collectedRent: number;
  overdueCount: number;
  pendingRequestCount: number;
}

export interface KosDetailDto extends KosSummaryDto {
  rooms: RoomDto[];
  caretakers: PersonDto[];
  residents: PersonDto[];
  /** Owner only. */
  joinCode?: string;
  invites?: InviteDto[];
  pendingRequests?: PendingRequestDto[];
  checklist?: ChecklistDto;
  /** Resident only. */
  myRoom?: { name: string; monthlyRent: number; dueDay: number; status: RoomStatus; payments: PaymentDto[] };
}

export interface InvitePreviewDto {
  kosName: string;
  city: string;
  ownerName: string;
  role: JoinableRole;
  roomName: string | null;
  status: InviteStatus;
}

export interface CreateKosBody {
  name: string;
  address: string;
  city: string;
  rooms: { name: string; monthlyRent: number }[];
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    /** Field-level codes for `validation_failed`, e.g. { email: "invalid" }. */
    fields?: Record<string, string>;
    retryAfterSeconds?: number;
    attemptsLeft?: number;
  };
}
