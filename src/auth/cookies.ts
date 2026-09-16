import { Cookie, CookieJar } from 'tough-cookie';

export interface StoredCookie { name: string; value: string; domain?: string; path?: string; expires?: number; secure?: boolean; httpOnly?: boolean; }

export class GeminiCookies {
  readonly jar = new CookieJar();
  async replace(cookies: StoredCookie[], url = 'https://gemini.google.com/'): Promise<void> {
    this.jar.removeAllCookiesSync();
    for (const input of cookies) {
      const cookie = new Cookie({ key: input.name, value: input.value, domain: input.domain ?? 'gemini.google.com', path: input.path ?? '/', expires: input.expires ? new Date(input.expires * 1000) : 'Infinity', secure: input.secure, httpOnly: input.httpOnly });
      await this.jar.setCookie(cookie, url);
    }
  }
  getHeader(url: string): Promise<string> { return this.jar.getCookieString(url); }
  absorb(setCookie: string | string[], url: string): Promise<void> { return this.jar.setCookie(Array.isArray(setCookie) ? setCookie[0] : setCookie, url).then(() => undefined); }
  snapshot(): Promise<StoredCookie[]> { return this.jar.getCookies('https://gemini.google.com/').then(cookies => cookies.map(cookie => ({ name: cookie.key, value: cookie.value, domain: cookie.domain ?? undefined, path: cookie.path ?? undefined, expires: cookie.expires instanceof Date ? cookie.expires.getTime() / 1000 : undefined, secure: cookie.secure, httpOnly: cookie.httpOnly }))); }
}
