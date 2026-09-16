import { describe, expect, it } from 'vitest';
import { EnvCookieSource } from '../src/auth/env-cookie-source.js';
import { SessionManager } from '../src/auth/session-manager.js';
import { FileCookieSource } from '../src/auth/file-cookie-source.js';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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

  it('persists a validated snapshot for browser-free startup', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'gemini-web-bridge-auth-'));
    try {
      const file = join(directory, 'gemini-auth-state.json');
      const writer = new FileCookieSource(file, 'test');
      const snapshot = await new EnvCookieSource(raw, 'test').current();
      await writer.save(snapshot);
      const loaded = await new FileCookieSource(file, 'test').current();
      expect(loaded.cookies).toEqual(snapshot.cookies);
      expect(JSON.parse(await readFile(file, 'utf8')).version).toBe(1);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
