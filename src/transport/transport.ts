import type { Dispatcher } from 'undici';

export interface GeminiHttpRequest {
  method: string;
  url: string | URL;
  headers?: Record<string, string>;
  body?: string | Uint8Array | Dispatcher.DispatchOptions['body'];
  signal?: AbortSignal;
}

export interface GeminiHttpResponse {
  status: number;
  headers: Record<string, string>;
  setCookies?: string[];
  body: AsyncIterable<Uint8Array>;
  text(): Promise<string>;
  json<T = unknown>(): Promise<T>;
}

export type StreamHandler = (chunk: Uint8Array) => Promise<void> | void;

export interface GeminiTransport {
  request(req: GeminiHttpRequest): Promise<GeminiHttpResponse>;
  stream(req: GeminiHttpRequest, handler: StreamHandler): Promise<void>;
}
