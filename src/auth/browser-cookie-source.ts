import type { CookieSource, CookieSnapshot, RefreshReason } from './cookie-source.js';
import { createRevision } from './cookie-source.js';
import { exportGeminiCookies } from '../browser-auth/cookie-export.js';
import { discoverBrowser, type BrowserDiscoveryOptions } from '../browser-auth/browser-discovery.js';
import { ensureProfilePath } from '../browser-auth/profile-path.js';
import { openPersistentContext, type BrowserContext } from '../browser-auth/persistent-context.js';
import { prepareLogin, waitForGeminiLogin } from '../browser-auth/login-flow.js';
import { rm } from 'node:fs/promises';
import { authStatePath, profilePath } from '../browser-auth/profile-path.js';
import { FileCookieSource } from './file-cookie-source.js';
export interface BrowserCookieSourceOptions extends BrowserDiscoveryOptions { accountId?: string; profileRoot?: string; timeoutMs?: number; headlessRecovery?: boolean; }
export class BrowserCookieSource implements CookieSource {
  private snapshotValue?: CookieSnapshot; private context?: BrowserContext; private refreshPromise?: Promise<CookieSnapshot>;
  private readonly stored: FileCookieSource;
  constructor(private readonly options: BrowserCookieSourceOptions = {}) {
    this.stored = new FileCookieSource(authStatePath(options.accountId ?? 'default', options.profileRoot), options.accountId);
  }
  async current(signal?: AbortSignal): Promise<CookieSnapshot> {
    if (this.snapshotValue) return this.snapshotValue;
    try { this.snapshotValue = await this.stored.current(); return this.snapshotValue; }
    catch { return this.refresh('startup', signal); }
  }
  async refresh(reason: RefreshReason, signal?: AbortSignal): Promise<CookieSnapshot> { if (this.refreshPromise) return this.refreshPromise; this.refreshPromise = this.load(reason, signal).finally(() => { this.refreshPromise = undefined; }); return this.refreshPromise; }
  private async load(_reason: RefreshReason, signal?: AbortSignal): Promise<CookieSnapshot> {
    if (signal?.aborted) throw signal.reason ?? new Error('Browser authentication aborted');
    const profile = await ensureProfilePath(this.options.accountId ?? 'default', this.options.profileRoot); const executable = discoverBrowser(this.options); let context: BrowserContext | undefined;
    try {
      const timeout = this.options.timeoutMs ?? 120000;
      // Keep the default interactive. A headless Playwright context is commonly
      // rejected by Google before the user can complete authentication.
      context = await openPersistentContext(profile, executable, this.options.headlessRecovery ?? false, timeout);
      let page = context.pages()[0] ?? await prepareLogin(context, this.options.timeoutMs ?? 120000);
      let cookies = await exportGeminiCookies(context).catch(() => []);
      if (!cookies.some(cookie => cookie.name === 'SID')) {
        await context.close();
        context = await openPersistentContext(profile, executable, false, timeout);
        page = await prepareLogin(context, timeout);
        await waitForGeminiLogin(page, timeout, async () => (await context!.cookies('https://gemini.google.com/')).some(cookie => cookie.name === 'SID'));
        cookies = await exportGeminiCookies(context);
      }
      const expires = cookies.map(cookie => cookie.expires).filter((value): value is number => value !== undefined); const snapshot = { revision: createRevision(), acquiredAt: Date.now(), expiresAt: expires.length ? Math.min(...expires) * 1000 : undefined, cookies };
      await this.stored.save(snapshot);
      this.snapshotValue = snapshot; return snapshot;
    } finally { await context?.close(); }
  }
  async close(): Promise<void> { await this.context?.close(); this.context = undefined; this.snapshotValue = undefined; }
  async logout(): Promise<void> { await this.close(); await rm(profilePath(this.options.accountId ?? 'default', this.options.profileRoot), { recursive: true, force: true }); }
}
