import type { StoredCookie } from './cookies.js';
import { randomUUID } from 'node:crypto';

export interface CookieSnapshot {
  revision: string;
  accountHint?: string;
  acquiredAt: number;
  expiresAt?: number;
  cookies: StoredCookie[];
}

export type RefreshReason = 'startup' | 'expired' | 'unauthorized' | 'manual';

export interface CookieSource {
  current(signal?: AbortSignal): Promise<CookieSnapshot>;
  refresh(reason: RefreshReason, signal?: AbortSignal): Promise<CookieSnapshot>;
  save?(snapshot: CookieSnapshot): Promise<void>;
  close?(): Promise<void>;
}

export function createRevision(): string {
  return randomUUID();
}
