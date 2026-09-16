import { request as undiciRequest, type Dispatcher } from 'undici';
import type { GeminiHttpRequest, GeminiHttpResponse, GeminiTransport, StreamHandler } from './transport.js';
import type { GeminiCookies } from '../auth/cookies.js';
import { buildSapisidHash } from '../auth/sapisid.js';
import { GeminiProtocolError } from '../shared/errors.js';

export interface UndiciTransportOptions { dispatcher?: Dispatcher; cookies?: GeminiCookies; }

export class UndiciTransport implements GeminiTransport {
  constructor(private readonly options: UndiciTransportOptions = {}) {}

  async request(req: GeminiHttpRequest): Promise<GeminiHttpResponse> {
    const url = String(req.url);
    const cookie = this.options.cookies ? await this.options.cookies.getHeader(url) : '';
    const requestHeaders:Record<string,string>={...(req.headers??{}),...(cookie?{cookie}:{})};
    const sapisid=cookie.match(/(?:^|;\s*)SAPISID=([^;]+)/)?.[1];
    if(sapisid){requestHeaders['x-goog-authuser']??='0';requestHeaders['x-same-domain']??='1';requestHeaders['x-sapisid-hash']??=buildSapisidHash(decodeURIComponent(sapisid));}
    const response = await undiciRequest(req.url, {
      method: req.method,
      headers: requestHeaders,
      body: req.body,
      signal: req.signal,
      dispatcher: this.options.dispatcher,
    });
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(response.headers)) {
      if (Array.isArray(value)) headers[key] = value.join(', ');
      else if (value !== undefined) headers[key] = String(value);
    }
    const setCookie = response.headers['set-cookie'];
    if (this.options.cookies && setCookie) {
      const values = Array.isArray(setCookie) ? setCookie : [setCookie];
      for (const value of values) await this.options.cookies.absorb(String(value), url);
    }
    const body = response.body as unknown as AsyncIterable<Uint8Array>;
    return {
      status: response.statusCode, headers, body,
      text: () => response.body.text(),
      json: <T>() => response.body.json() as Promise<T>,
    };
  }

  async stream(req: GeminiHttpRequest, handler: StreamHandler): Promise<void> {
    const response = await this.request(req);
    if (response.status < 200 || response.status >= 300) {
      throw new GeminiProtocolError(`Gemini upstream returned HTTP ${response.status}`, response.status, response.status >= 500);
    }
    for await (const chunk of response.body) await handler(chunk);
  }
}
