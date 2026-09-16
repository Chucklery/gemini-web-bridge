import { request as undiciRequest, type Dispatcher } from 'undici';
import type { GeminiHttpRequest, GeminiHttpResponse, GeminiTransport, StreamHandler } from './transport.js';
import type { GeminiCookies } from '../auth/cookies.js';

export interface UndiciTransportOptions { dispatcher?: Dispatcher; cookies?: GeminiCookies; }

export class UndiciTransport implements GeminiTransport {
  constructor(private readonly options: UndiciTransportOptions = {}) {}

  async request(req: GeminiHttpRequest): Promise<GeminiHttpResponse> {
    const url = String(req.url);
    const cookie = this.options.cookies ? await this.options.cookies.getHeader(url) : '';
    const response = await undiciRequest(req.url, {
      method: req.method,
      headers: { ...(req.headers ?? {}), ...(cookie ? { cookie } : {}) },
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
      throw new Error(`Gemini upstream returned HTTP ${response.status}`);
    }
    for await (const chunk of response.body) await handler(chunk);
  }
}
