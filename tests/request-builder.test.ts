import { describe, expect, it } from 'vitest';
import { GeminiRequestBuilder } from '../src/gemini/request-builder.js';

describe('Gemini request builder', () => {
  it('keeps the positional payload and selected model local', () => {
    const built = new GeminiRequestBuilder().build({
      snlM0e: 'token', bl: 'build', fsid: 'sid', models: [{
        name: 'gemini-test', displayName: 'Test', description: '', hash: 'hash', mode: 2,
        capabilities: [], default: true,
      }],
    }, { prompt: 'hello', model: 'missing', attachments: [{ url: 'https://example.test/a', name: 'a.txt' }] });
    const params = new URLSearchParams(built.body);
    const payload = JSON.parse(JSON.parse(params.get('f.req')!)[1]) as unknown[];
    expect(payload).toHaveLength(97);
    expect(payload[79]).toBe(2);
    expect(payload[0]).toEqual([['hello', 0, null, [['https://example.test/a', 'a.txt']], null, null, 0]]);
    expect(built.headers['x-goog-ext-525001261-jspb']).toContain('"hash"');
  });
});
