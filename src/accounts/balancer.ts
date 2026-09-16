import type { Account } from './account.js';
import { isHealthy } from './health.js';
export class AccountBalancer { pick(accounts: Account[]): Account { const healthy=accounts.filter(account=>isHealthy(account)); if(!healthy.length)throw new Error('No healthy Gemini accounts available'); return healthy.sort((a,b)=>a.lastUsedAt-b.lastUsedAt)[0]; } }
