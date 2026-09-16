import { z } from "zod";
const schema = z.object({
  HOST: z.string().default("127.0.0.1"),
  PORT: z.coerce.number().int().positive().default(8787),
  GEMINI_TIMEOUT_MS: z.coerce.number().positive().default(600000),
  GEMINI_COOKIES: z.string().default(""),
  GEMINI_PROXY: z.string().default(""),
  API_KEY: z.string().default(""),
});
export type AppConfig = z.infer<typeof schema>;
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return schema.parse(env);
}
