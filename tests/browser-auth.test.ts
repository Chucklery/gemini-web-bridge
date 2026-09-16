import { describe, expect, it } from 'vitest';
import { discoverBrowser } from '../src/browser-auth/browser-discovery.js';
import { profilePath } from '../src/browser-auth/profile-path.js';

describe('browser authentication boundaries', () => {
  it('selects explicit channels and never uses an account id as a profile path', () => {
    expect(discoverBrowser({ channel: 'chrome', platform: 'linux' })).toEqual({ channel: 'chrome' });
    expect(profilePath('alice@example.com', '/tmp/gemini-test')).toMatch(/^\/tmp\/gemini-test\/browser-profiles\/[a-f0-9]{24}$/);
    expect(profilePath('alice@example.com', '/tmp/gemini-test')).not.toContain('alice@example.com');
  });

  it('prefers an explicit local executable path', () => {
    expect(discoverBrowser({ executablePath: '/opt/google/chrome', platform: 'win32' })).toEqual({ executablePath: '/opt/google/chrome' });
  });
});
