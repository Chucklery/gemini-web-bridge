import { ProxyAgent as LegacyProxyAgent } from 'proxy-agent';
import { ProxyAgent as UndiciProxyAgent, type Dispatcher } from 'undici';
import { UndiciTransport } from './undici-transport.js';
import type { GeminiHttpRequest, GeminiTransport, StreamHandler } from './transport.js';
import type { GeminiCookies } from '../auth/cookies.js';

export interface BrowserFingerprint {
  browser: 'Chrome' | 'Edge' | 'Firefox'; version: string; platform?: string;
  userAgent: string; language?: string; proxy?: string; cookies?: GeminiCookies;
}

export class FingerprintTransport implements GeminiTransport {
  private readonly inner: UndiciTransport;
  constructor(readonly fingerprint: BrowserFingerprint, dispatcher?: Dispatcher) {
    // proxy-agent remains a supported dependency for Node ecosystem compatibility;
    // Undici requires its own Dispatcher implementation at runtime.
    void LegacyProxyAgent;
    const selected = dispatcher ?? (fingerprint.proxy ? new UndiciProxyAgent(fingerprint.proxy) : undefined);
    this.inner = new UndiciTransport({ dispatcher: selected as unknown as Dispatcher, cookies: fingerprint.cookies });
  }
  private headers(input?: Record<string, string>): Record<string, string> {
    const headers = { ...(input ?? {}) };
    headers['user-agent'] ??= this.fingerprint.userAgent;
    headers['accept-language'] ??= this.fingerprint.language ?? 'en-US,en;q=0.9';
    headers['sec-ch-ua-mobile'] ??= '?0';
    if (this.fingerprint.browser !== 'Firefox') {
      const brand = this.fingerprint.browser === 'Edge' ? 'Microsoft Edge' : 'Google Chrome';
      headers['sec-ch-ua'] ??= `"Not=A?Brand";v="99", "${brand}";v="${this.fingerprint.version}", "Chromium";v="${this.fingerprint.version}`;
      headers['sec-ch-ua-platform'] ??= `"${this.fingerprint.platform ?? 'Windows'}"`;
    }
    return headers;
  }
  request(req: GeminiHttpRequest) { return this.inner.request({ ...req, headers: this.headers(req.headers) }); }
  stream(req: GeminiHttpRequest, handler: StreamHandler) { return this.inner.stream({ ...req, headers: this.headers(req.headers) }, handler); }
}
