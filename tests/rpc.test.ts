import { describe, expect, it } from 'vitest';
import { parseRpcRecords } from '../src/gemini/rpc.js';
describe('Gemini RPC framing', () => {
  it('unwraps the outer batchexecute frame', () => {
    const records=parseRpcRecords(JSON.stringify([['wrb.fr','x','payload'],['e']]));
    expect(records).toHaveLength(2); expect(records[0][0]).toBe('wrb.fr');
  });
  it('accepts the anti XSSI prefix', () => {
    const input=")]}'\n"+JSON.stringify([['e']]);
    expect(parseRpcRecords(input)[0][0]).toBe('e');
  });
  it('parses complete length-prefixed frames', () => {
    const first = JSON.stringify([['wrb.fr', 'x', 'one']]);
    const second = JSON.stringify([['wrb.fr', 'y', 'two']]);
    const input = `${first.length}\n${first}${second.length}\n${second}`;
    expect(parseRpcRecords(input).map(record => record[1])).toEqual(['x', 'y']);
  });
});
