import type { MeDto } from "../api-types";

/**
 * Where a signed-in person belongs, decided purely from their account state. Kept free of React and of
 * runtime imports so scripts/check-landing.mjs can exercise every state without a browser.
 */
export type Stage = "verify" | "join" | "onboarding-owner" | "onboarding-guest" | "app";

/** The page a person should be on right now (locale-less path). */
export function resolveLanding(me: MeDto): string {
  if (!me.user.verified) return "/verify";

  const unfinished = me.memberships.find((m) => !m.onboardingComplete);
  if (unfinished) return `/onboarding/guest/${unfinished.kos.id}`;
  if (me.memberships.length > 0) return "/app";

  if (me.joinRequests.some((r) => r.status === "pending")) return "/join";
  return me.user.intent === "owner" ? "/onboarding/owner" : "/join";
}

/** Whether a person in this state may be on the given stage's page. */
export function canAccess(me: MeDto, stage: Stage, kosId?: string): boolean {
  if (stage === "verify") return !me.user.verified;
  if (!me.user.verified) return false;

  switch (stage) {
    case "join":
      // Any verified person may join (another) kos, e.g. a caretaker taking on a second one.
      return true;
    case "onboarding-owner":
      // The first-kos setup is for people with nothing yet; everyone else adds a kos from inside the app.
      return me.memberships.length === 0;
    case "onboarding-guest": {
      const membership = me.memberships.find((m) => m.kos.id === kosId);
      return !!membership && !membership.onboardingComplete;
    }
    case "app":
      return me.memberships.length > 0;
  }
}

/** Only same-site relative paths are followed after login, so `?next=` can't become an open redirect. */
export function safeNext(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return null;
  return next;
}

/**
 * Where to send someone who just authenticated. Verifying and finishing kos onboarding always come first;
 * otherwise a safe `next` wins, then the natural landing page.
 */
export function postAuthDestination(me: MeDto, next?: string | null): string {
  const landing = resolveLanding(me);
  if (landing === "/verify" || landing.startsWith("/onboarding/guest/")) return landing;
  return safeNext(next) ?? landing;
}

/**
 * Where to send someone right after they log in. Like `postAuthDestination`, but an invite link takes
 * priority: the person came to accept it, so verify first if needed, then land on the invite.
 */
export function loginDestination(me: MeDto, options: { next?: string | null; invite?: string }): string {
  if (options.invite) {
    if (!me.user.verified) return `/verify?invite=${options.invite}`;
    return `/invite/${options.invite}`;
  }
  const destination = postAuthDestination(me, options.next);
  if (destination === "/verify" && options.next && safeNext(options.next)) {
    return `/verify?next=${encodeURIComponent(options.next)}`;
  }
  return destination;
}
