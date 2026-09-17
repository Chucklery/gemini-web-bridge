import type { StoredCookie } from '../auth/cookies.js';
import type { CookieSnapshot } from '../auth/cookie-source.js';
import { createCookieSnapshot, exportGeminiCookies } from './cookie-export.js';
import { copyChromeProfileForCookieImport, discoverChromeProfiles, type ChromeProfile, type ChromeProfileDiscoveryOptions } from './chrome-profile.js';
import { discoverBrowser } from './browser-discovery.js';
import { openPersistentContext, type BrowserContext } from './persistent-context.js';

export interface ChromeCookieImportOptions extends ChromeProfileDiscoveryOptions {
  executablePath?: string;
  timeoutMs?: number;
}

export interface ImportedChromeCookies {
  profileName: string;
  cookies: StoredCookie[];
}

export async function importGeminiCookiesFromChrome(options: ChromeCookieImportOptions = {}): Promise<ImportedChromeCookies> {
  const profiles = await discoverChromeProfiles(options);
  if (!profiles.length) throw new Error('No local Chrome profile with a Cookie database was found');

  const executable = discoverBrowser({
    channel: 'chrome',
    executablePath: options.executablePath,
    platform: options.platform,
    env: options.env,
  });
  const matches: ImportedChromeCookies[] = [];

  for (const profile of profiles) {
    try {
      const cookies = await readChromeProfileCookies(profile, executable, options.timeoutMs ?? 30000);
      matches.push({ profileName: profile.profileName, cookies });
    } catch (error) {
      if (options.profileName) throw error;
    }
  }

  if (!matches.length) {
    throw new Error('No valid Gemini session was found in local Chrome. Open Gemini in Chrome and try again.');
  }
  if (!options.profileName && matches.length > 1) {
    throw new Error('Multiple Chrome profiles contain Gemini sessions. Set GEMINI_CHROME_PROFILE_NAME to choose one.');
  }
  return matches[0];
}

export async function importGeminiSnapshotFromChrome(options: ChromeCookieImportOptions = {}, accountHint?: string): Promise<CookieSnapshot & { profileName: string }> {
  const imported = await importGeminiCookiesFromChrome(options);
  return { ...createCookieSnapshot(imported.cookies, accountHint), profileName: imported.profileName };
}

async function readChromeProfileCookies(
  profile: ChromeProfile,
  executable: ReturnType<typeof discoverBrowser>,
  timeout: number,
): Promise<StoredCookie[]> {
  const copied = await copyChromeProfileForCookieImport(profile);
  let context: BrowserContext | undefined;

  try {
    context = await openPersistentContext(copied.userDataDir, executable, true, timeout, [
      `--profile-directory=${copied.profileName}`,
      '--no-first-run',
      '--no-default-browser-check',
    ]);
    return await exportGeminiCookies(context);
  } finally {
    try { await context?.close(); } finally { await copied.cleanup(); }
  }
}
