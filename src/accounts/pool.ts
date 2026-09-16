import type { Account } from './account.js';
import { AccountBalancer } from './balancer.js';
export class AccountPool {
  constructor(private readonly accounts: Account[], private readonly balancer = new AccountBalancer()) {}
  get size(): number { return this.accounts.length; }
  async run<T>(operation: (account: Account) => Promise<T>): Promise<T> { const account = this.balancer.pick(this.accounts); try { const result = await operation(account); account.failures = 0; account.lastUsedAt = Date.now(); return result; } catch (error) { account.failures++; throw error; } }
}
