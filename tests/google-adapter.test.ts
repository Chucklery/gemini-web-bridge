import { describe, expect, it } from 'vitest';
import { googleContentsToPrompt } from '../src/shared/types.js';

describe('Google content conversion', () => {
  it('preserves roles and text parts without serializing the wire shape', () => {
    expect(googleContentsToPrompt([
      { role: 'user', parts: [{ text: 'hello ' }, { text: 'world' }] },
      { role: 'model', parts: [{ text: 'answer' }] },
    ], { parts: [{ text: 'be concise' }] })).toBe('system: be concise\nuser: hello world\nmodel: answer');
  });

  it('accepts simple text contents', () => {
    expect(googleContentsToPrompt(['hello', { text: 'world' }])).toBe('hello\nworld');
  });
});
