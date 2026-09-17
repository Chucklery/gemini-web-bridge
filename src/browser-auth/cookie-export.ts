import type { StoredCookie } from '../auth/cookies.js';
import type { BrowserContext } from './persistent-context.js';
import { cookiesForGemini } from '../auth/cookie-policy.js';
import { createRevision, type CookieSnapshot } from '../auth/cookie-source.js';

export async function exportGeminiCookies(context: BrowserContext): Promise<StoredCookie[]> {
  const cookies = await context.cookies('https://gemini.google.com/');
  return cookiesForGemini(cookies.map(cookie => ({ ...cookie, expires: cookie.expirationDate ?? cookie.expires })) as StoredCookie[]);
}

export function createCookieSnapshot(cookies: StoredCookie[], accountHint?: string): CookieSnapshot {
  const expires = cookies.map(cookie => cookie.expires).filter((value): value is number => value !== undefined);
  return {
    revision: createRevision(),
    accountHint,
    acquiredAt: Date.now(),
    expiresAt: expires.length ? Math.min(...expires) * 1000 : undefined,
    cookies,
  };
}
