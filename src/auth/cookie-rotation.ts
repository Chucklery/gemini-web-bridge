import { createRevision } from './cookie-source.js';
import type { CookieSnapshot } from './cookie-source.js';
import { GeminiCookies, type StoredCookie } from './cookies.js';
import type { SessionManager } from './session-manager.js';
import type { GeminiHttpResponse, GeminiTransport } from '../transport/transport.js';

const ROTATE_URL = 'https://accounts.google.com/RotateCookies';

export interface CookieRotationResult {
  revision: string;
  rotatedAt: number;
}

export type RotationTransportFactory = (cookies: GeminiCookies) => GeminiTransport;

/** Owns one account's cookie rotation and prevents concurrent rotations. */
export class CookieRotationService {
  private running?: Promise<CookieRotationResult>;

  constructor(
    private readonly session: SessionManager,
    private readonly transportFor: RotationTransportFactory,
  ) {}

  rotate(signal?: AbortSignal): Promise<CookieRotationResult> {
    if (this.running) return this.running;
    this.running = this.rotateOnce(signal).finally(() => { this.running = undefined; });
    return this.running;
  }

  private async rotateOnce(signal?: AbortSignal): Promise<CookieRotationResult> {
    const current = await this.session.current(signal);
    const candidate = new GeminiCookies();
    await candidate.replace(await current.cookies.snapshot());
    const response = await this.transportFor(candidate).request({
      method: 'POST',
      url: ROTATE_URL,
      headers: {
        'content-type': 'application/json',
        origin: 'https://accounts.google.com',
      },
      body: '[000,"-0000000000000000000"]',
      signal,
    });
    await consume(response);
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Gemini cookie rotation failed with HTTP ${response.status}`);
    }
    for (const value of response.setCookies ?? readSetCookies(response.headers)) {
      await candidate.absorb(value, ROTATE_URL);
    }
    const cookies = await candidate.snapshot();
    const rotatedAt = Date.now();
    const snapshot: CookieSnapshot = {
      revision: createRevision(),
      accountHint: current.snapshot.accountHint,
      acquiredAt: rotatedAt,
      expiresAt: cookieExpiry(cookies),
      cookies,
    };
    const active = await this.session.replace(snapshot, current.revision);
    return { revision: active.revision, rotatedAt };
  }
}

async function consume(response: GeminiHttpResponse): Promise<void> {
  for await (const _chunk of response.body) { /* release the response before committing state */ }
}

function readSetCookies(headers: Record<string, string>): string[] {
  const value = headers['set-cookie'] ?? headers['Set-Cookie'];
  return value ? [value] : [];
}

function cookieExpiry(cookies: StoredCookie[]): number | undefined {
  const values = cookies.map(cookie => cookie.expires).filter((value): value is number => value !== undefined);
  return values.length ? Math.min(...values) * 1000 : undefined;
}
