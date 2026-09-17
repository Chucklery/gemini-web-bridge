import { randomUUID } from 'node:crypto';
import { ENDPOINTS } from './rpc.js';
import type { GeminiTransport } from '../transport/transport.js';

export interface GeminiUpload { name: string; mimeType: string; data: Uint8Array; }
export interface UploadedGeminiFile { url: string; name: string; }
export interface UploadLimits { maxBytes?: number; maxFiles?: number; maxTotalBytes?: number; }

const DEFAULT_LIMITS = { maxBytes: 20 * 1024 * 1024, maxFiles: 4, maxTotalBytes: 50 * 1024 * 1024 };

export function validateUploads(files: GeminiUpload[], limits: UploadLimits = {}): void {
  const effective = { ...DEFAULT_LIMITS, ...limits };
  if (files.length > effective.maxFiles) throw new Error(`Gemini upload limit exceeded: at most ${effective.maxFiles} files`);
  let total = 0;
  for (const file of files) {
    if (!file.name || !file.mimeType) throw new Error('Gemini upload requires a file name and MIME type');
    if (file.data.byteLength > effective.maxBytes) throw new Error(`Gemini upload limit exceeded for ${file.name}`);
    total += file.data.byteLength;
  }
  if (total > effective.maxTotalBytes) throw new Error('Gemini upload total size limit exceeded');
}

export class GeminiUploadClient {
  constructor(private readonly transport: GeminiTransport, private readonly headers: Record<string, string> = {}, private readonly limits: UploadLimits = {}) {}

  async upload(pushId: string, file: GeminiUpload, signal?: AbortSignal): Promise<UploadedGeminiFile> {
    validateUploads([file], this.limits);
    const response = await this.transport.request({
      method: 'POST',
      url: `${ENDPOINTS.upload}?push-id=${encodeURIComponent(pushId)}&upload-id=${encodeURIComponent(randomUUID())}`,
      headers: { ...this.headers, 'content-type': file.mimeType, 'x-goog-upload-protocol': 'raw', 'x-goog-upload-file-name': file.name, 'x-goog-upload-header-content-length': String(file.data.byteLength), 'x-goog-upload-header-content-type': file.mimeType },
      body: file.data,
      signal,
    });
    const body = await response.text();
    if (response.status < 200 || response.status >= 300) throw new Error(`Gemini upload failed with HTTP ${response.status}`);
    const url = response.headers.location ?? response.headers['x-goog-upload-url'] ?? extractUrl(body);
    if (!url) throw new Error('Gemini upload returned no file URL');
    return { url, name: file.name };
  }
}

function extractUrl(body: string): string | undefined {
  try {
    const value = JSON.parse(body) as { url?: unknown; file?: { uri?: unknown } };
    if (typeof value.url === 'string') return value.url;
    if (typeof value.file?.uri === 'string') return value.file.uri;
  } catch { /* upstream may return a plain URL */ }
  return /^https?:\/\/\S+$/.test(body.trim()) ? body.trim() : undefined;
}
