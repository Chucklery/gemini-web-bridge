import { z } from "zod";
const schema = z.object({
  HOST: z.string().default("127.0.0.1"),
  PORT: z.coerce.number().int().positive().default(8787),
  GEMINI_TIMEOUT_MS: z.coerce.number().positive().default(600000),
  GEMINI_COOKIES: z.string().default(""),
  GEMINI_AUTH_MODE: z.enum(['auto', 'env', 'browser']).default('auto'),
  GEMINI_AUTH_PROFILE: z.string().default('default'),
  GEMINI_AUTH_TIMEOUT_MS: z.coerce.number().positive().default(120000),
  GEMINI_BROWSER_CHANNEL: z.enum(['auto', 'chrome', 'msedge']).default('auto'),
  GEMINI_BROWSER_EXECUTABLE_PATH: z.string().default(''),
  GEMINI_CHROME_USER_DATA_DIR: z.string().default(''),
  GEMINI_CHROME_PROFILE_NAME: z.string().default(''),
  // Google may reject sign-in from automated/headless browser contexts.
  // Recovery should therefore be visible and completed by the user by default.
  GEMINI_BROWSER_HEADLESS_RECOVERY: z.coerce.boolean().default(false),
  GEMINI_AUTH_DATA_DIR: z.string().default(''),
  GEMINI_COOKIE_REFRESH_SKEW_MS: z.coerce.number().nonnegative().default(300000),
  GEMINI_SSE_HEARTBEAT_MS: z.coerce.number().positive().default(2000),
  GEMINI_STREAM_STALL_TIMEOUT_MS: z.coerce.number().positive().default(120000),
  GEMINI_REPLAY_TTL_MS: z.coerce.number().positive().default(900000),
  GEMINI_PROXY: z.string().default(""),
  API_KEY: z.string().default(""),
});
export type AppConfig = z.infer<typeof schema>;
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return schema.parse(env);
}
