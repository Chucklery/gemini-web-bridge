import type { StoredCookie } from './cookies.js';

const REQUIRED = ['SID', 'SAPISID', 'APISID'];
const ALLOWED_DOMAIN = /(^|\.)google\.com$/i;

export class CookiePolicyError extends Error {}

export function validateCookies(cookies: StoredCookie[], now = Date.now()): void {
  if (!cookies.length) throw new CookiePolicyError('No Gemini cookies were provided');
  const names = new Set(cookies.map(cookie => cookie.name));
  const missing = REQUIRED.filter(name => !names.has(name));
  if (missing.length) throw new CookiePolicyError(`Missing required Gemini cookies: ${missing.join(', ')}`);
  for (const cookie of cookies) {
    if (!cookie.name || !cookie.value) throw new CookiePolicyError('Cookie name and value are required');
    if (cookie.domain && !ALLOWED_DOMAIN.test(cookie.domain.replace(/^\./, ''))) throw new CookiePolicyError(`Cookie domain is not allowed: ${cookie.domain}`);
    if (cookie.expires !== undefined && cookie.expires * 1000 <= now) throw new CookiePolicyError(`Cookie is expired: ${cookie.name}`);
  }
}

export function cookiesForGemini(cookies: StoredCookie[], now = Date.now()): StoredCookie[] {
  validateCookies(cookies, now);
  return cookies.filter(cookie => {
    const domain = (cookie.domain ?? 'gemini.google.com').replace(/^\./, '').toLowerCase();
    return domain === 'google.com' || domain.endsWith('.google.com');
  }).map(cookie => ({ ...cookie }));
}
