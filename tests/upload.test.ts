import { describe, expect, it } from 'vitest';
import { GeminiUploadClient, validateUploads } from '../src/gemini/upload.js';
import type { GeminiTransport } from '../src/transport/transport.js';

describe('Gemini upload budget', () => {
  it('rejects oversized files before transport', () => {
    expect(() => validateUploads([{ name: 'large.bin', mimeType: 'application/octet-stream', data: new Uint8Array(11) }], { maxBytes: 10 })).toThrow(/large.bin/);
  });
  it('rejects too many files', () => {
    const files = Array.from({ length: 3 }, (_, index) => ({ name: String(index), mimeType: 'text/plain', data: new Uint8Array() }));
    expect(() => validateUploads(files, { maxFiles: 2 })).toThrow(/at most 2/);
  });
  it('uses the push id and does not expose file bytes in errors', async () => {
    let requestBody: unknown;
    let requestUrl = '';
    const transport: GeminiTransport = {
      async request(request) {
        requestBody = request.body;
        requestUrl = String(request.url);
        return { status: 200, headers: { location: 'https://files.example.test/1' }, body: (async function* () {})(), text: async () => '', json: async <T>() => ({}) as T };
      },
      async stream() {},
    };
    const result = await new GeminiUploadClient(transport).upload('push id', { name: 'photo.png', mimeType: 'image/png', data: new Uint8Array([1, 2, 3]) });
    expect(result).toEqual({ url: 'https://files.example.test/1', name: 'photo.png' });
    expect(new URL(requestUrl).searchParams.get('push-id')).toBe('push id');
    expect(requestBody).toEqual(new Uint8Array([1, 2, 3]));
  });
});
