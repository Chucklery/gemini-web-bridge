import { describe, expect, it } from 'vitest';
import { GeminiCookies } from '../src/auth/cookies.js';
describe('GeminiCookies', () => {
  it('round trips cookies through tough-cookie', async () => {
    const cookies = new GeminiCookies();
    await cookies.replace([{ name: 'SID', value: 'abc' }]);
    expect(await cookies.getHeader('https://gemini.google.com/app')).toBe('SID=abc');
    await cookies.absorb('HSID=def; Path=/; Domain=gemini.google.com', 'https://gemini.google.com/app');
    expect(await cookies.getHeader('https://gemini.google.com/app')).toContain('HSID=def');
  });
});
