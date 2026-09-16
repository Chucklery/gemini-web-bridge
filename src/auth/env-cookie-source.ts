import { CookiePolicyError, validateCookies } from './cookie-policy.js';
import type { CookieSnapshot, CookieSource, RefreshReason } from './cookie-source.js';
import { createRevision } from './cookie-source.js';
import type { StoredCookie } from './cookies.js';

export class EnvCookieSource implements CookieSource {
  private readonly cookies: StoredCookie[];
  private readonly snapshotValue: CookieSnapshot;

  constructor(raw: string, private readonly accountHint?: string) {
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { throw new CookiePolicyError('GEMINI_COOKIES must be a JSON array'); }
    if (!Array.isArray(parsed)) throw new CookiePolicyError('GEMINI_COOKIES must be a JSON array');
    this.cookies = parsed as StoredCookie[];
    validateCookies(this.cookies);
    const acquiredAt = Date.now();
    this.snapshotValue = { revision: createRevision(), accountHint, acquiredAt, cookies: this.cookies.map(cookie => ({ ...cookie })) };
  }

  async current(): Promise<CookieSnapshot> { return this.snapshotValue; }
  async refresh(_reason: RefreshReason): Promise<CookieSnapshot> { return this.snapshotValue; }
}
