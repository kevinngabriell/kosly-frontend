/** First value of a Next.js search param, which can be a string, an array or missing. */
export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const INVITE_TOKEN = /^[A-Za-z0-9_-]{1,100}$/;

/**
 * An invite token from the URL, or undefined if it isn't the expected shape. Tokens end up inside URL
 * paths and API calls, so anything unexpected is dropped instead of being passed along.
 */
export function parseInviteToken(value: string | string[] | undefined): string | undefined {
  const candidate = firstParam(value);
  return candidate && INVITE_TOKEN.test(candidate) ? candidate : undefined;
}

/** `/path?a=1&b=2`, skipping empty values. */
export function withQuery(path: string, query: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) search.set(key, value);
  }
  const text = search.toString();
  return text ? `${path}?${text}` : path;
}
