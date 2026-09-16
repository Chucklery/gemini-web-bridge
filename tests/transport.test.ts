import { describe, expect, it } from 'vitest';
import { FingerprintTransport } from '../src/transport/browser-transport.js';

describe('FingerprintTransport', () => {
  it('can be constructed with a stable browser identity', () => {
    const transport = new FingerprintTransport({ browser: 'Chrome', version: '146', userAgent: 'test-agent' });
    expect(transport.fingerprint.userAgent).toBe('test-agent');
  });
});
