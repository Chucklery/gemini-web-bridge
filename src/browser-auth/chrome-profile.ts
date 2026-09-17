import { access, chmod, copyFile, mkdtemp, mkdir, readdir, rm, stat } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';

export interface ChromeProfileDiscoveryOptions {
  userDataDir?: string;
  profileName?: string;
  platform?: NodeJS.Platform;
  env?: NodeJS.ProcessEnv;
}

export interface ChromeProfile {
  userDataDir: string;
  profileName: string;
  profilePath: string;
  cookieDatabasePath: string;
}

export interface ChromeProfileCopy {
  userDataDir: string;
  profileName: string;
  cleanup(): Promise<void>;
}

const PROFILE_NAME_PATTERN = /^(Default|Profile \d+)$/;

export function chromeUserDataDirs(options: Pick<ChromeProfileDiscoveryOptions, 'platform' | 'env'> = {}): string[] {
  const platform = options.platform ?? process.platform;
  const env = options.env ?? process.env;
  const home = homedir();

  if (platform === 'darwin') {
    return [join(home, 'Library', 'Application Support', 'Google', 'Chrome')];
  }

  if (platform === 'win32') {
    const localAppData = env.LOCALAPPDATA || join(home, 'AppData', 'Local');
    return [join(localAppData, 'Google', 'Chrome', 'User Data')];
  }

  const configHome = env.XDG_CONFIG_HOME || join(home, '.config');
  return [
    join(configHome, 'google-chrome'),
    join(configHome, 'google-chrome-beta'),
    join(configHome, 'google-chrome-unstable'),
  ];
}

export async function discoverChromeProfiles(options: ChromeProfileDiscoveryOptions = {}): Promise<ChromeProfile[]> {
  const roots = options.userDataDir
    ? [resolve(options.userDataDir)]
    : chromeUserDataDirs(options);
  const requestedProfileName = options.profileName ? validateProfileName(options.profileName) : undefined;
  const profiles: ChromeProfile[] = [];

  for (const userDataDir of roots) {
    if (!(await isDirectory(userDataDir))) continue;

    const names = requestedProfileName ? [requestedProfileName] : await profileNames(userDataDir);

    for (const profileName of names) {
      const profilePath = join(userDataDir, profileName);
      if (!(await isDirectory(profilePath))) continue;
      const cookieDatabasePath = await findCookieDatabase(profilePath);
      if (!cookieDatabasePath) continue;
      profiles.push({ userDataDir, profileName, profilePath, cookieDatabasePath });
    }
  }

  return profiles;
}

export async function copyChromeProfileForCookieImport(profile: ChromeProfile): Promise<ChromeProfileCopy> {
  const temporaryUserDataDir = await mkdtemp(join(tmpdir(), 'gemini-web-bridge-chrome-'));

  try {
    await chmod(temporaryUserDataDir, 0o700);
    await copyPrivateFile(join(profile.userDataDir, 'Local State'), join(temporaryUserDataDir, 'Local State'));

    const temporaryProfilePath = join(temporaryUserDataDir, profile.profileName);
    const sourceCookieDirectory = dirname(profile.cookieDatabasePath);
    const cookieDirectoryRelativeToProfile = relative(profile.profilePath, sourceCookieDirectory);
    const temporaryCookieDirectory = join(temporaryProfilePath, cookieDirectoryRelativeToProfile);
    await mkdir(temporaryCookieDirectory, { recursive: true, mode: 0o700 });
    const entries = await readdir(sourceCookieDirectory, { withFileTypes: true });
    const cookieFiles = entries.filter(entry => entry.isFile() && entry.name.startsWith('Cookies'));
    if (!cookieFiles.some(entry => entry.name === 'Cookies')) throw new Error('Chrome Cookie database is unavailable');

    for (const entry of cookieFiles) {
      await copyPrivateFile(join(sourceCookieDirectory, entry.name), join(temporaryCookieDirectory, entry.name));
    }

    return {
      userDataDir: temporaryUserDataDir,
      profileName: profile.profileName,
      cleanup: async () => rm(temporaryUserDataDir, { recursive: true, force: true }),
    };
  } catch {
    await rm(temporaryUserDataDir, { recursive: true, force: true });
    throw new Error('Unable to copy the Chrome Cookie database. Close Chrome and try again.');
  }
}

function validateProfileName(profileName: string): string {
  if (!PROFILE_NAME_PATTERN.test(profileName)) {
    throw new Error('GEMINI_CHROME_PROFILE_NAME must be Default or Profile <number>');
  }
  return profileName;
}

async function profileNames(userDataDir: string): Promise<string[]> {
  const entries = await readdir(userDataDir, { withFileTypes: true });
  return entries
    .filter(entry => entry.isDirectory() && PROFILE_NAME_PATTERN.test(entry.name))
    .map(entry => entry.name)
    .sort((left, right) => left === 'Default' ? -1 : right === 'Default' ? 1 : left.localeCompare(right, undefined, { numeric: true }));
}

async function isDirectory(path: string): Promise<boolean> {
  try { return (await stat(path)).isDirectory(); } catch { return false; }
}

async function isFile(path: string): Promise<boolean> {
  try { return (await stat(path)).isFile(); } catch { return false; }
}

async function findCookieDatabase(profilePath: string): Promise<string | undefined> {
  const candidates = [join(profilePath, 'Cookies'), join(profilePath, 'Network', 'Cookies')];
  for (const candidate of candidates) if (await isFile(candidate)) return candidate;
  return undefined;
}

async function copyPrivateFile(source: string, destination: string): Promise<void> {
  await access(source);
  await copyFile(source, destination);
  await chmod(destination, 0o600);
}
