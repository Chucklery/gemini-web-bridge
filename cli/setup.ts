import { loadConfig } from '../src/config/env.js';
const config=loadConfig();
console.log(JSON.stringify({host:config.HOST,port:config.PORT,hasApiKey:Boolean(config.API_KEY),hasCookies:Boolean(config.GEMINI_COOKIES)},null,2));
