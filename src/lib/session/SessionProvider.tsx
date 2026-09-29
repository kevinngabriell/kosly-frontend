"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiError, apiJson } from "@/lib/api-client";
import type { MeDto } from "@/lib/api-types";

export type SessionState =
  | { status: "loading" }
  | { status: "anonymous" }
  /** The API couldn't be reached, which is different from "not signed in". */
  | { status: "error" }
  | { status: "authenticated"; me: MeDto };

interface SessionContextValue {
  state: SessionState;
  /** Adopt a fresh profile the API just returned (login, register, verify, ...) without another round trip. */
  setMe: (me: MeDto) => void;
  /** Re-read the profile from the API. */
  refresh: () => Promise<MeDto | null>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/** Reads the current profile. A 401 means "signed out"; anything else means the API couldn't be reached. */
async function fetchSession(): Promise<SessionState> {
  try {
    return { status: "authenticated", me: await apiJson<MeDto>("/api/v1/me") };
  } catch (error) {
    return error instanceof ApiError && error.status === 401 ? { status: "anonymous" } : { status: "error" };
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: "loading" });

  const refresh = useCallback(async (): Promise<MeDto | null> => {
    const next = await fetchSession();
    setState(next);
    return next.status === "authenticated" ? next.me : null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchSession().then((next) => {
      if (!cancelled) setState(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setMe = useCallback((me: MeDto) => setState({ status: "authenticated", me }), []);

  const logout = useCallback(async () => {
    try {
      await apiJson<void>("/api/v1/auth/logout", { method: "POST" });
    } finally {
      // Even if the call failed, drop the local view so the person isn't left looking at private data.
      setState({ status: "anonymous" });
    }
  }, []);

  const value = useMemo(() => ({ state, setMe, refresh, logout }), [state, setMe, refresh, logout]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside <SessionProvider>");
  return value;
}

/**
 * The signed-in profile, for components that only render behind a stage guard (which guarantees a session).
 * Throws if used outside one, since that would be a bug, not a runtime condition to handle.
 */
export function useMe(): MeDto {
  const { state } = useSession();
  if (state.status !== "authenticated") throw new Error("useMe must be used behind a stage guard");
  return state.me;
}
