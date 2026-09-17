import type { Account } from './account.js';
import { AccountLease } from './account.js';
import { AccountBalancer } from './balancer.js';
import type { GeminiModel } from '../gemini/models.js';
import { GeminiProtocolError } from '../shared/errors.js';
import { isHealthy } from './health.js';
export class AccountPool {
  private readonly leases=new Map<string,AccountLease>();
  constructor(private readonly accounts: Account[], private readonly balancer = new AccountBalancer()) {}
  get size(): number { return this.accounts.length; }
  status(){const now=Date.now();return {total:this.accounts.length,available:this.accounts.filter(a=>isHealthy(a)).length,coolingDown:this.accounts.filter(a=>a.enabled&&a.cooldownUntil>now).length,accounts:this.accounts.map(a=>({accountId:a.id,state:a.authState==='auth_required'?'auth_required':!a.enabled?'unavailable':a.cooldownUntil>now?'cooldown':a.failures>=3?'unavailable':'ready',consecutiveFailures:a.failures,lastUsedAt:a.lastUsedAt||undefined}))};}
  listModels(): GeminiModel[] {
    const unique = new Map<string, GeminiModel>();
    for (const model of this.accounts.flatMap(account => account.client.models)) unique.set(model.name, model);
    return [...unique.values()].sort((a, b) => a.name.localeCompare(b.name));
  }
  async run<T>(operation: (account: Account) => Promise<T>): Promise<T> { const account=this.balancer.pick(this.accounts); return this.lease(account).run(async()=>{try{const result=await operation(account);account.failures=0;account.cooldownUntil=0;account.authState='ready';account.lastUsedAt=Date.now();return result;}catch(error){if(error instanceof GeminiProtocolError && error.kind==='authentication') account.authState='auth_required'; else {account.failures++;account.cooldownUntil=Date.now()+Math.min(30000,1000*2**account.failures);}account.lastUsedAt=Date.now();throw error;}}); }
  async rotateCookies(accountId?: string, signal?: AbortSignal): Promise<void> { const account = accountId ? this.accounts.find(candidate => candidate.id === accountId) : this.balancer.pick(this.accounts); if (!account) throw new Error(`Unknown Gemini account: ${accountId}`); if (!account.rotateCookies) throw new Error(`Cookie rotation is not configured for account: ${account.id}`); await this.lease(account).run(() => account.rotateCookies!(signal)); }
  private lease(account: Account): AccountLease { const existing=this.leases.get(account.id); if(existing) return existing; const created=new AccountLease(); this.leases.set(account.id,created); return created; }
  async runWithRetry<T>(operation:(account:Account)=>Promise<T>, attempts=this.accounts.length):Promise<T>{let last:unknown;for(let i=0;i<Math.max(1,attempts);i++){try{return await this.run(operation);}catch(error){last=error;if(error instanceof GeminiProtocolError&&error.kind==='authentication'){const account=this.accounts.find(candidate=>candidate.authState==='auth_required'&&candidate.refresh);if (!account?.refresh) break;try{account.authState='refreshing';account.client=await account.refresh();account.authState='ready';account.failures=0;continue;}catch(refreshError){last=refreshError;account.authState='auth_required';break;}}}}throw last instanceof Error?last:new Error(String(last));}
}
