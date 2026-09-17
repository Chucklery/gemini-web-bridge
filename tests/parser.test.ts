import { describe, expect, it } from 'vitest';
import { GeminiStreamParser } from '../src/gemini/stream-parser.js';
import { parseGeminiResponse } from '../src/gemini/response-parser.js';

describe('GeminiStreamParser', () => {
  it('does not emit done until the stream is finished', () => {
    const parser = new GeminiStreamParser();
    const payload = JSON.stringify(['wrb.fr', null, JSON.stringify(['x', ['cid', 'rid']])]);
    expect(parser.push(new TextEncoder().encode(payload + '\n')).some(e => e.type === 'done')).toBe(false);
    expect(parser.finish().some(e => e.type === 'done')).toBe(true);
  });
  it('extracts text and session from a candidate payload', () => {
    const payload: unknown[] = []; payload[1] = ['cid', 'rid']; payload[4] = [['rc_1', ['hello'], null, null, null, null, null, null, [2, 0]]];
    const record = JSON.stringify([['wrb.fr', 'StreamGenerate', JSON.stringify(payload)]]);
    const events = parseGeminiResponse(record).events;
    expect(events).toContainEqual({ type: 'text', text: 'hello' });
    expect(events).toContainEqual({ type: 'session', session: { cid: 'cid', rid: 'rid', rcid: 'rc_1' } });
  });
  it('waits for a split length-prefixed frame', () => {
    const payload: unknown[] = []; payload[4] = [['rc_1', ['hello']]];
    const frame = JSON.stringify([['wrb.fr', 'StreamGenerate', JSON.stringify(payload)]]);
    const parser = new GeminiStreamParser();
    expect(parser.push(new TextEncoder().encode(`${frame.length}\n${frame.slice(0, 8)}`)).filter(event => event.type === 'text')).toEqual([]);
    expect(parser.push(new TextEncoder().encode(frame.slice(8)))).toContainEqual({ type: 'text', text: 'hello' });
  });
  it('normalizes web image resources into internal events', () => {
    const payload: unknown[] = [];
    const candidate: unknown[] = ['rc_1', ['hello'], null, null, null, null, null, null, [1, 0]];
    candidate[12] = [null, [[[['https://img.example.test/a'], null, null, 'alt']]]];
    payload[4] = [candidate];
    const record = JSON.stringify([['wrb.fr', 'StreamGenerate', JSON.stringify(payload)]]);
    expect(parseGeminiResponse(record).events).toContainEqual({ type: 'resource', resource: { kind: 'web_image', url: 'https://img.example.test/a', name: undefined, mimeType: 'image/*' } });
  });
});
