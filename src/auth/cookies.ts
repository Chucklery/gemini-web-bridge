import { Cookie, CookieJar } from 'tough-cookie';

export interface StoredCookie { name: string; value: string; domain?: string; path?: string; expires?: number; secure?: boolean; httpOnly?: boolean; sameSite?: 'lax' | 'strict' | 'none'; }

export class GeminiCookies {
  private jar = new CookieJar();
  async replace(cookies: StoredCookie[], url = 'https://gemini.google.com/'): Promise<void> {
    const next = new CookieJar();
    for (const input of cookies) {
      const cookie = new Cookie({ key: input.name, value: input.value, domain: input.domain, path: input.path, expires: input.expires ? new Date(input.expires * 1000) : 'Infinity', secure: input.secure, httpOnly: input.httpOnly, sameSite: input.sameSite });
      await next.setCookie(cookie, url);
    }
    this.jar = next;
  }
  getHeader(url: string): Promise<string> { return this.jar.getCookieString(url); }
  async absorb(setCookie: string | string[], url: string): Promise<void> { for (const value of Array.isArray(setCookie) ? setCookie : [setCookie]) await this.jar.setCookie(value, url); }
  snapshot(): Promise<StoredCookie[]> { return this.jar.getCookies('https://gemini.google.com/').then(cookies => cookies.map(cookie => ({ name: cookie.key, value: cookie.value, domain: cookie.domain ?? undefined, path: cookie.path ?? undefined, expires: cookie.expires instanceof Date ? cookie.expires.getTime() / 1000 : undefined, secure: cookie.secure, httpOnly: cookie.httpOnly, sameSite: cookie.sameSite as StoredCookie['sameSite'] }))); }
}
