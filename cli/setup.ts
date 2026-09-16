import { loadEnvFile } from 'node:process';
import { loadConfig } from '../src/config/env.js';
loadEnvFile();
const config=loadConfig();
if (process.argv[2] === 'codex') {
  console.log(`[model_providers.gemini_web]\nname = "Gemini Web Bridge"\nbase_url = "http://${config.HOST}:${config.PORT}/v1"\nenv_key = "GEMINI_WEB2API_KEY"\nwire_api = "responses"\nsupports_websockets = false\nrequest_max_retries = 1\nstream_max_retries = 1\nstream_idle_timeout_ms = ${config.GEMINI_STREAM_STALL_TIMEOUT_MS}`);
} else console.log(JSON.stringify({host:config.HOST,port:config.PORT,hasApiKey:Boolean(config.API_KEY),hasCookies:Boolean(config.GEMINI_COOKIES),authMode:config.GEMINI_AUTH_MODE},null,2));
