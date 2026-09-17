import { describe, expect, it } from 'vitest';
import { GeminiStreamParser } from '../src/gemini/stream-parser.js';
describe('GeminiStreamParser', () => {
  it('does not emit done until the stream is finished', () => {
    const parser = new GeminiStreamParser();
    const payload = JSON.stringify(['wrb.fr', null, JSON.stringify(['x', ['cid', 'rid']])]);
    expect(parser.push(new TextEncoder().encode(payload + '\n')).some(e => e.type === 'done')).toBe(false);
    expect(parser.finish().some(e => e.type === 'done')).toBe(true);
  });
  it('extracts text and session from a candidate payload', async () => {
    const { parseGeminiResponse } = await import('../src/gemini/response-parser.js');
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
    const first = parser.push(new TextEncoder().encode(`${frame.length}\n${frame.slice(0, 8)}`));
    expect(first.filter(event => event.type === 'text')).toEqual([]);
    const second = parser.push(new TextEncoder().encode(frame.slice(8)));
    expect(second).toContainEqual({ type: 'text', text: 'hello' });
  });
});
