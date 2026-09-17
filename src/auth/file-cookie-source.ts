import { chmod, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { CookiePolicyError, validateCookies } from './cookie-policy.js';
import type { StoredCookie } from './cookies.js';
import type { CookieSnapshot, CookieSource, RefreshReason } from './cookie-source.js';
import { createRevision } from './cookie-source.js';

interface PersistedAuthState {
  version: 1 | 2;
  revision?: string;
  acquiredAt: number;
  expiresAt?: number;
  cookies: StoredCookie[];
}

export class FileCookieSource implements CookieSource {
  constructor(private readonly stateFile: string, private readonly accountHint?: string) {}

  async current(): Promise<CookieSnapshot> {
    return this.read();
  }

  async refresh(_reason: RefreshReason): Promise<CookieSnapshot> {
    return this.read();
  }

  private async read(): Promise<CookieSnapshot> {
    let value: PersistedAuthState;
    try {
      value = JSON.parse(await readFile(this.stateFile, 'utf8')) as PersistedAuthState;
    } catch {
      throw new CookiePolicyError(`Gemini auth state is unavailable: ${this.stateFile}`);
    }
    if ((value.version !== 1 && value.version !== 2) || !Array.isArray(value.cookies)) {
      throw new CookiePolicyError('Gemini auth state has an unsupported format');
    }
    if (value.expiresAt !== undefined && value.expiresAt <= Date.now()) {
      throw new CookiePolicyError('Gemini auth state has expired');
    }
    validateCookies(value.cookies);
    return {
      revision: value.revision ?? createRevision(), accountHint: this.accountHint,
      acquiredAt: value.acquiredAt, expiresAt: value.expiresAt,
      cookies: value.cookies.map(cookie => ({ ...cookie })),
    };
  }

  async save(snapshot: CookieSnapshot): Promise<void> {
    validateCookies(snapshot.cookies);
    await mkdir(dirname(this.stateFile), { recursive: true, mode: 0o700 });
    const temporary = `${this.stateFile}.${process.pid}.tmp`;
    const value: PersistedAuthState = {
      version: 2, revision: snapshot.revision, acquiredAt: snapshot.acquiredAt, expiresAt: snapshot.expiresAt,
      cookies: snapshot.cookies.map(cookie => ({ ...cookie })),
    };
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
    await chmod(temporary, 0o600);
    await rename(temporary, this.stateFile);
  }
}
