import type { Account } from './account.js';
export class AccountBalancer { pick(accounts: Account[]): Account { const healthy = accounts.filter(a => a.enabled && a.failures < 3); if (!healthy.length) throw new Error('No healthy Gemini accounts available'); return healthy.sort((a,b) => a.lastUsedAt - b.lastUsedAt)[0]; } }
