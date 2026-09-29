"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, apiJson } from "./api-client";

export type ApiResource<T> =
  | { status: "loading"; data?: undefined; refreshing: boolean; reload: () => void }
  | { status: "ready"; data: T; refreshing: boolean; reload: () => void }
  | { status: "notFound"; data?: undefined; refreshing: boolean; reload: () => void }
  | { status: "error"; data?: undefined; refreshing: boolean; reload: () => void };

interface Result<T> {
  path: string;
  attempt: number;
  data?: T;
  error?: unknown;
}

/**
 * GETs an API path and keeps the answer. `reload()` refetches in the background: the previous data stays on
 * screen (`refreshing` is true meanwhile) so a list doesn't flash empty after every action. Pass null to
 * wait, for example until a route param is known.
 */
export function useApiResource<T>(path: string | null): ApiResource<T> {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result<T> | null>(null);

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    apiJson<T>(path)
      .then((data) => {
        if (!cancelled) setResult({ path, attempt, data });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setResult((previous) => ({ path, attempt, data: previous?.path === path ? previous.data : undefined, error }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [path, attempt]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  const forThisPath = result && result.path === path ? result : null;
  const refreshing = !forThisPath || forThisPath.attempt !== attempt;

  if (forThisPath?.error && !refreshing) {
    const notFound = forThisPath.error instanceof ApiError && forThisPath.error.status === 404;
    return { status: notFound ? "notFound" : "error", refreshing, reload };
  }
  if (forThisPath?.data !== undefined) return { status: "ready", data: forThisPath.data, refreshing, reload };
  return { status: "loading", refreshing, reload };
}
