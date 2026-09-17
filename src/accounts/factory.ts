import { GeminiCookies, type StoredCookie } from '../auth/cookies.js';
import { GeminiClient } from '../gemini/client.js';
import { FingerprintTransport } from '../transport/browser-transport.js';
import type { Account } from './account.js';
export function transportFromCookies(cookies: GeminiCookies, proxy?: string): FingerprintTransport {
  return new FingerprintTransport({browser:'Chrome',version:'146',userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/146 Safari/537.36',proxy,cookies});
}
export async function accountFromCookies(id:string, cookies:StoredCookie[], proxy?:string):Promise<Account> {
  const jar=new GeminiCookies(); await jar.replace(cookies);
  const transport=transportFromCookies(jar, proxy);
  return {id,client:new GeminiClient(transport),enabled:true,failures:0,lastUsedAt:0,cooldownUntil:0};
}
