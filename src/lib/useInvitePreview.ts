"use client";

import { useCallback, useEffect, useState } from "react";
import { apiJson } from "./api-client";
import type { InvitePreviewDto } from "./api-types";

export type InvitePreviewState =
  | { status: "none" }
  | { status: "loading" }
  | { status: "ready"; preview: InvitePreviewDto }
  /** The API doesn't know this token at all. */
  | { status: "unknown" }
  /** The check itself failed (offline, server down), which says nothing about the invite. */
  | { status: "error" };

/** Looks up what an invite token is for. Public endpoint: works before anyone is signed in. */
export function useInvitePreview(token: string | undefined): {
  state: InvitePreviewState;
  retry: () => void;
} {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ token: string; attempt: number; state: InvitePreviewState } | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    apiJson<InvitePreviewDto>(`/api/v1/invites/${encodeURIComponent(token)}`)
      .then((preview) => !cancelled && setResult({ token, attempt, state: { status: "ready", preview } }))
      .catch((error: { status?: number }) => {
        if (cancelled) return;
        setResult({ token, attempt, state: { status: error.status === 404 ? "unknown" : "error" } });
      });
    return () => {
      cancelled = true;
    };
  }, [token, attempt]);

  const retry = useCallback(() => {
    setResult(null);
    setAttempt((value) => value + 1);
  }, []);

  if (!token) return { state: { status: "none" }, retry };
  // A result only counts if it answers the current token and attempt; otherwise we're still loading.
  const current = result && result.token === token && result.attempt === attempt ? result.state : null;
  return { state: current ?? { status: "loading" }, retry };
}
