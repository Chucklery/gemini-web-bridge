import { loadEnvFile } from 'node:process';
import { createApp } from '../src/server/app.js';
import { loadConfig } from '../src/config/env.js';
import { accountFromCookies } from '../src/accounts/factory.js';
import { AccountPool } from '../src/accounts/pool.js';
import { EnvCookieSource } from '../src/auth/env-cookie-source.js';
import { BrowserCookieSource } from '../src/auth/browser-cookie-source.js';
import { SessionManager } from '../src/auth/session-manager.js';
import { CookieRotationService } from '../src/auth/cookie-rotation.js';
import { transportFromCookies } from '../src/accounts/factory.js';
loadEnvFile();
const config=loadConfig();
const source = config.GEMINI_AUTH_MODE === 'env'
  ? new EnvCookieSource(config.GEMINI_COOKIES)
  : new BrowserCookieSource({ accountId: config.GEMINI_AUTH_PROFILE, profileRoot: config.GEMINI_AUTH_DATA_DIR || undefined, channel: config.GEMINI_BROWSER_CHANNEL, executablePath: config.GEMINI_BROWSER_EXECUTABLE_PATH || undefined, timeoutMs: config.GEMINI_AUTH_TIMEOUT_MS, headlessRecovery: config.GEMINI_BROWSER_HEADLESS_RECOVERY });
let pool: AccountPool | undefined;
try { const manager = new SessionManager(source); const session = await manager.current(); const account = await accountFromCookies('default',session.snapshot.cookies,config.GEMINI_PROXY); const rotation = new CookieRotationService(manager, cookies => transportFromCookies(cookies, config.GEMINI_PROXY)); account.rotateCookies = async signal => { await rotation.rotate(signal); account.client = (await accountFromCookies('default',(await manager.current()).snapshot.cookies,config.GEMINI_PROXY)).client; }; account.refresh = async () => (await accountFromCookies('default',(await manager.refresh('unauthorized')).snapshot.cookies,config.GEMINI_PROXY)).client; pool = new AccountPool([account]); }
catch (error) { console.error(error instanceof Error ? error.message : 'Gemini authentication failed'); process.exitCode = 1; }
const app=createApp(pool);
if (pool) await app.listen({host:config.HOST,port:config.PORT});
