import type { BrowserExecutable } from './browser-discovery.js';
export interface BrowserCookie { name: string; value: string; domain?: string; path?: string; expires?: number; expirationDate?: number; secure?: boolean; httpOnly?: boolean; sameSite?: 'Lax' | 'Strict' | 'None' | 'lax' | 'strict' | 'none'; }
export interface BrowserPage { goto(url: string, options?: { waitUntil?: string; timeout?: number }): Promise<unknown>; url(): string; waitForTimeout(ms: number): Promise<void>; close(): Promise<void>; }
export interface BrowserContext { pages(): BrowserPage[]; newPage(): Promise<BrowserPage>; cookies(urls?: string | string[]): Promise<BrowserCookie[]>; close(): Promise<void>; }
export interface BrowserLauncher { launchPersistentContext(userDataDir: string, options: Record<string, unknown>): Promise<BrowserContext>; }
export async function openPersistentContext(profile: string, executable: BrowserExecutable, headless: boolean, timeout: number): Promise<BrowserContext> {
  const module = await import('playwright-core');
  return (module.chromium as unknown as BrowserLauncher).launchPersistentContext(profile, { channel: executable.channel, executablePath: executable.executablePath, headless, timeout });
}
