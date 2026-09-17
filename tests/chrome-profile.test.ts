import { describe, expect, it } from 'vitest';
import { access, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { copyChromeProfileForCookieImport, discoverChromeProfiles } from '../src/browser-auth/chrome-profile.js';
import { importGeminiCookiesFromChrome } from '../src/browser-auth/chrome-cookie-import.js';

describe('Chrome profile import boundaries', () => {
  it('discovers only conventional Chrome profiles with a Cookie database', async () => {
    const root = await mkdtemp(join(tmpdir(), 'gemini-web-bridge-chrome-test-'));
    try {
      await mkdir(join(root, 'Default'), { recursive: true });
      await mkdir(join(root, 'Profile 2'), { recursive: true });
      await mkdir(join(root, 'Profile 3', 'Network'), { recursive: true });
      await mkdir(join(root, 'Other Data'), { recursive: true });
      await writeFile(join(root, 'Default', 'Cookies'), 'default-cookie-db');
      await writeFile(join(root, 'Profile 2', 'Cookies'), 'profile-cookie-db');
      await writeFile(join(root, 'Profile 3', 'Network', 'Cookies'), 'network-cookie-db');
      const profiles = await discoverChromeProfiles({ userDataDir: root });
      expect(profiles.map(profile => profile.profileName)).toEqual(['Default', 'Profile 2', 'Profile 3']);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('copies only the local state and Cookie files to a private temporary directory', async () => {
    const root = await mkdtemp(join(tmpdir(), 'gemini-web-bridge-chrome-test-'));
    try {
      await mkdir(join(root, 'Profile 2', 'Network'), { recursive: true });
      await writeFile(join(root, 'Local State'), 'encrypted-key-metadata');
      await writeFile(join(root, 'Profile 2', 'Network', 'Cookies'), 'encrypted-cookie-db');
      await writeFile(join(root, 'Profile 2', 'Network', 'Cookies-journal'), 'journal');
      const profile = (await discoverChromeProfiles({ userDataDir: root, profileName: 'Profile 2' }))[0];
      const copy = await copyChromeProfileForCookieImport(profile);
      try {
        expect(await readFile(join(copy.userDataDir, 'Local State'), 'utf8')).toBe('encrypted-key-metadata');
        expect(await readFile(join(copy.userDataDir, 'Profile 2', 'Network', 'Cookies'), 'utf8')).toBe('encrypted-cookie-db');
        expect((await stat(join(copy.userDataDir, 'Local State'))).mode & 0o777).toBe(0o600);
      } finally {
        await copy.cleanup();
      }
      await expect(access(copy.userDataDir)).rejects.toThrow();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects unsafe explicit profile names', async () => {
    await expect(discoverChromeProfiles({ userDataDir: '/tmp', profileName: '../Default' })).rejects.toThrow(/GEMINI_CHROME_PROFILE_NAME/);
  });

  it('requires an explicit profile when more than one Chrome profile exists', async () => {
    const root = await mkdtemp(join(tmpdir(), 'gemini-web-bridge-chrome-test-'));
    try {
      for (const name of ['Default', 'Profile 2']) {
        await mkdir(join(root, name), { recursive: true });
        await writeFile(join(root, name, 'Cookies'), 'encrypted-cookie-db');
      }
      await expect(importGeminiCookiesFromChrome({ userDataDir: root })).rejects.toThrow(/GEMINI_CHROME_PROFILE_NAME/);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
