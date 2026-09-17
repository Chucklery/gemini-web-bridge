import { describe, expect, it } from 'vitest';
import { EnvCookieSource } from '../src/auth/env-cookie-source.js';
import { CookieRotationService } from '../src/auth/cookie-rotation.js';
import { SessionManager } from '../src/auth/session-manager.js';
import type { GeminiTransport } from '../src/transport/transport.js';

const raw = JSON.stringify([
  { name: 'SID', value: 'sid', domain: 'gemini.google.com', path: '/' },
  { name: 'SAPISID', value: 'sap', domain: '.google.com', path: '/' },
  { name: 'APISID', value: 'api', domain: '.google.com', path: '/' },
]);

function transport(cookies?: { absorb(value: string, url: string): Promise<void> }): GeminiTransport {
  return {
    async request(request) {
      expect(request.url).toBe('https://accounts.google.com/RotateCookies');
      expect(request.body).toBe('[000,"-0000000000000000000"]');
      return {
        status: 200, headers: {}, setCookies: ['SID=rotated; Domain=google.com; Path=/'],
        body: (async function* () { yield new Uint8Array(); })(),
        text: async () => '', json: async <T>() => ({}) as T,
      };
    },
    async stream() {},
  };
}

describe('CookieRotationService', () => {
  it('single-flights rotation and atomically advances the session revision', async () => {
    const session = new SessionManager(new EnvCookieSource(raw));
    const service = new CookieRotationService(session, () => transport());
    const [first, second] = await Promise.all([service.rotate(), service.rotate()]);
    expect(first).toEqual(second);
    expect(session.revision).toBe(first.revision);
    expect(await (await session.current()).cookies.getHeader('https://gemini.google.com/app')).toContain('SID=rotated');
  });
});
