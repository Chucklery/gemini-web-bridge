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
  if (!options.profileName && profiles.length > 1) {
    throw new Error('Multiple Chrome profiles were found. Set GEMINI_CHROME_PROFILE_NAME to choose one.');
  }

  const executable = discoverBrowser({
    channel: 'chrome',
    executablePath: options.executablePath,
    platform: options.platform,
    env: options.env,
  });
  const profile = profiles[0];
  try {
    const cookies = await readChromeProfileCookies(profile, executable, options.timeoutMs ?? 30000);
    return { profileName: profile.profileName, cookies };
  } catch {
    throw new Error('Unable to import the selected Chrome profile. Confirm Gemini is signed in and close Chrome before retrying.');
  }
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
