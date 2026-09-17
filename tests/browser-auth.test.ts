import { describe, expect, it } from 'vitest';
import { discoverBrowser } from '../src/browser-auth/browser-discovery.js';
import { exportGeminiCookies } from '../src/browser-auth/cookie-export.js';
import { profilePath } from '../src/browser-auth/profile-path.js';
import type { BrowserContext } from '../src/browser-auth/persistent-context.js';

describe('browser authentication boundaries', () => {
  it('selects explicit channels and never uses an account id as a profile path', () => {
    expect(discoverBrowser({ channel: 'chrome', platform: 'linux' })).toEqual({ channel: 'chrome' });
    expect(profilePath('alice@example.com', '/tmp/gemini-test')).toMatch(/^\/tmp\/gemini-test\/browser-profiles\/[a-f0-9]{24}$/);
    expect(profilePath('alice@example.com', '/tmp/gemini-test')).not.toContain('alice@example.com');
  });

  it('prefers an explicit local executable path', () => {
    expect(discoverBrowser({ executablePath: '/opt/google/chrome', platform: 'win32' })).toEqual({ executablePath: '/opt/google/chrome' });
  });

  it('exports the URL-scoped cookies accepted by the Gemini cookie policy', async () => {
    const context: BrowserContext = {
      pages: () => [],
      newPage: async () => { throw new Error('not used'); },
      cookies: async () => [
        { name: 'SID', value: 'sid', domain: '.google.com', path: '/' },
        { name: 'SAPISID', value: 'sap', domain: '.google.com', path: '/' },
        { name: 'APISID', value: 'api', domain: '.google.com', path: '/' },
        { name: 'PREF', value: 'pref', domain: '.google.com', path: '/', expirationDate: 2000000000 },
      ],
      close: async () => {},
    };
    const cookies = await exportGeminiCookies(context);
    expect(cookies.map(cookie => cookie.name)).toEqual(['SID', 'SAPISID', 'APISID', 'PREF']);
    expect(cookies.find(cookie => cookie.name === 'PREF')?.expires).toBe(2000000000);
  });
});
