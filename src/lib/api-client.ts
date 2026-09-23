const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export function getApiBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
  }
  return API_BASE_URL;
}

export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${getApiBaseUrl()}${path}`, init);
}
