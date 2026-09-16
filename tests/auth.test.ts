import { describe, expect, it } from 'vitest';
import { EnvCookieSource } from '../src/auth/env-cookie-source.js';
import { SessionManager } from '../src/auth/session-manager.js';

const raw = JSON.stringify([
  { name: 'SID', value: 'sid', domain: 'gemini.google.com', path: '/' },
  { name: 'SAPISID', value: 'sap', domain: '.google.com', path: '/' },
  { name: 'APISID', value: 'api', domain: '.google.com', path: '/' },
]);

describe('cookie authentication foundation', () => {
  it('validates env cookies without changing their scope', async () => {
    const source = new EnvCookieSource(raw);
    const snapshot = await source.current();
    expect(snapshot.cookies[0]).toMatchObject({ domain: 'gemini.google.com', path: '/' });
    expect(snapshot.cookies[1]).toMatchObject({ domain: '.google.com' });
  });

  it('refreshes concurrently through one session load', async () => {
    let calls = 0;
    const source = new EnvCookieSource(raw);
    const wrapped = { current: source.current.bind(source), refresh: async () => { calls++; await new Promise(resolve => setTimeout(resolve, 5)); return source.current(); } };
    const manager = new SessionManager(wrapped);
    await Promise.all([manager.current(), manager.current(), manager.current()]);
    expect(calls).toBe(1);
  });

  it('rejects incomplete cookie sets', () => {
    expect(() => new EnvCookieSource(JSON.stringify([{ name: 'SID', value: 'secret' }]))).toThrow(/SAPISID/);
  });
});
