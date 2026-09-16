import { loadEnvFile } from 'node:process';
import { loadConfig } from '../src/config/env.js';
import { BrowserCookieSource } from '../src/auth/browser-cookie-source.js';
import { redact } from '../src/auth/redaction.js';

loadEnvFile();
const config = loadConfig();
const command = process.argv[2] ?? 'status';
const source = new BrowserCookieSource({ accountId: config.GEMINI_AUTH_PROFILE, profileRoot: config.GEMINI_AUTH_DATA_DIR || undefined, channel: config.GEMINI_BROWSER_CHANNEL, executablePath: config.GEMINI_BROWSER_EXECUTABLE_PATH || undefined, timeoutMs: config.GEMINI_AUTH_TIMEOUT_MS, headlessRecovery: config.GEMINI_BROWSER_HEADLESS_RECOVERY });
try {
  if (command === 'login' || command === 'refresh') {
    const snapshot = await source.refresh(command === 'login' ? 'manual' : 'expired');
    console.log(JSON.stringify({ status: 'ready', revision: snapshot.revision, acquiredAt: snapshot.acquiredAt, cookieCount: snapshot.cookies.length }));
  } else if (command === 'status') {
    const snapshot = await source.current();
    console.log(JSON.stringify({ status: 'ready', revision: snapshot.revision, acquiredAt: snapshot.acquiredAt, expiresAt: snapshot.expiresAt, cookieCount: snapshot.cookies.length }));
  } else if (command === 'logout') {
    await source.logout(); console.log(JSON.stringify({ status: 'signed_out' }));
  } else throw new Error(`Unknown auth command: ${command}`);
} catch (error) {
  console.error(JSON.stringify({ status: 'auth_required', error: redact(error instanceof Error ? error.message : error) })); process.exitCode = 1;
} finally { await source.close(); }
