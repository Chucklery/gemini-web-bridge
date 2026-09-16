import { GeminiCookies, type StoredCookie } from './cookies.js';
import type { CookieSnapshot, CookieSource, RefreshReason } from './cookie-source.js';

export interface AuthenticatedSession { revision: string; cookies: GeminiCookies; snapshot: CookieSnapshot; }

export class SessionManager {
  private active?: AuthenticatedSession;
  private refreshPromise?: Promise<AuthenticatedSession>;

  constructor(private readonly source: CookieSource, private readonly validate?: (cookies: GeminiCookies, signal?: AbortSignal) => Promise<void>) {}

  async current(signal?: AbortSignal): Promise<AuthenticatedSession> {
    if (this.active) return this.active;
    return this.refresh('startup', signal);
  }

  async refresh(reason: RefreshReason, signal?: AbortSignal): Promise<AuthenticatedSession> {
    if (this.refreshPromise) return this.refreshPromise;
    this.refreshPromise = this.load(reason, signal).finally(() => { this.refreshPromise = undefined; });
    return this.refreshPromise;
  }

  private async load(reason: RefreshReason, signal?: AbortSignal): Promise<AuthenticatedSession> {
    const snapshot = await this.source.refresh(reason, signal);
    const next = new GeminiCookies();
    await next.replace(snapshot.cookies);
    if (this.validate) await this.validate(next, signal);
    const session = { revision: snapshot.revision, cookies: next, snapshot };
    return this.activate(session);
  }

  private activate(session: AuthenticatedSession): AuthenticatedSession { this.active = session; return session; }
  invalidate(revision?: string): void { if (!revision || this.active?.revision === revision) this.active = undefined; }

  get revision(): string | undefined { return this.active?.revision; }
  async close(): Promise<void> { await this.source.close?.(); this.active = undefined; }
}
