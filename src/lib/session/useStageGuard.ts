"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { MeDto } from "@/lib/api-types";
import { canAccess, resolveLanding, type Stage } from "./landing";
import { type SessionState, useSession } from "./SessionProvider";

interface StageGuard {
  state: SessionState;
  me: MeDto | null;
  /** True once the person is signed in and allowed on this page. Render the page only when this is true. */
  ready: boolean;
}

interface StageGuardOptions {
  /** Which kos, for the per-kos stage. */
  kosId?: string;
  /**
   * Stop redirecting. A screen sets this right after the action that changes the person's state (verified,
   * kos created, onboarding finished) so its own navigation isn't overridden by the guard noticing the change.
   */
  paused?: boolean;
}

/**
 * Keeps a page honest about who may see it. Signed-out visitors go to /login (and come back after);
 * signed-in people who belong elsewhere are sent to where they do belong. This is UX routing only. The
 * API enforces access on every call.
 */
export function useStageGuard(stage: Stage, { kosId, paused = false }: StageGuardOptions = {}): StageGuard {
  const { state } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const me = state.status === "authenticated" ? state.me : null;
  const allowed = me ? canAccess(me, stage, kosId) : false;

  useEffect(() => {
    if (paused) return;
    if (state.status === "anonymous") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else if (me && !allowed) {
      router.replace(resolveLanding(me));
    }
  }, [paused, state.status, me, allowed, pathname, router]);

  return { state, me, ready: !!me && (allowed || paused) };
}
