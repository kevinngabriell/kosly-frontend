import type { ApiErrorBody } from "./api-types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Empty string means same origin (the dev mock API lives in this app). Anything else must be https
// outside local development so a misconfigured deploy can't send credentials in plain text.
export function getApiBaseUrl(): string {
  if (API_BASE_URL === undefined) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
  }
  if (
    process.env.NODE_ENV === "production" &&
    API_BASE_URL.startsWith("http://") &&
    !/^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(API_BASE_URL)
  ) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must use https:// outside local development");
  }
  return API_BASE_URL;
}

export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  // The session lives in an httpOnly cookie set by the API, so every call has to carry credentials.
  return fetch(`${getApiBaseUrl()}${path}`, { credentials: "include", ...init });
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly body?: ApiErrorBody["error"],
  ) {
    super(code);
    this.name = "ApiError";
  }
}

/** True when the request never reached the API (offline, DNS, CORS), as opposed to an API error reply. */
export function isNetworkError(error: unknown): boolean {
  return !(error instanceof ApiError);
}

/**
 * JSON convenience over `apiFetch`. Resolves with the parsed body (or `undefined` for 204) and rejects
 * with an `ApiError` carrying the API's error code, so callers can map `code` to a translated message.
 */
export async function apiJson<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await apiFetch(path, {
    method: options.method ?? (options.body === undefined ? "GET" : "POST"),
    headers: options.body === undefined ? undefined : { "Content-Type": "application/json" },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!res.ok) {
    let parsed: ApiErrorBody["error"] | undefined;
    try {
      parsed = ((await res.json()) as ApiErrorBody).error;
    } catch {
      parsed = undefined;
    }
    throw new ApiError(res.status, parsed?.code ?? "unknown", parsed);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
