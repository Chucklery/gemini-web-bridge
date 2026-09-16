import { createHash } from 'node:crypto';
export function buildSapisidHash(sapisid: string, origin = 'https://gemini.google.com'): string { const epoch = Math.floor(Date.now() / 1000); const digest = createHash('sha1').update(String(epoch) + ' ' + sapisid + ' ' + origin).digest('hex'); return 'SAPISIDHASH ' + epoch + '_' + digest; }
