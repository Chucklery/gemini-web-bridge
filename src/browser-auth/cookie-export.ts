import type { StoredCookie } from '../auth/cookies.js';
import type { BrowserContext } from './persistent-context.js';
import { cookiesForGemini } from '../auth/cookie-policy.js';
export async function exportGeminiCookies(context: BrowserContext): Promise<StoredCookie[]> {
  const cookies = await context.cookies('https://gemini.google.com/');
  return cookiesForGemini(cookies.map(cookie => ({ ...cookie, expires: cookie.expirationDate ?? cookie.expires })) as StoredCookie[]);
}
