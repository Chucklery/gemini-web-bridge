import type { Account } from './account.js';
import { AccountLease } from './account.js';
import { AccountBalancer } from './balancer.js';
import type { GeminiModel } from '../gemini/models.js';
export class AccountPool {
  private readonly leases=new Map<string,AccountLease>();
  constructor(private readonly accounts: Account[], private readonly balancer = new AccountBalancer()) {}
  get size(): number { return this.accounts.length; }
  status(){const now=Date.now();return {total:this.accounts.length,available:this.accounts.filter(a=>a.enabled&&a.failures<3&&a.cooldownUntil<=now).length,coolingDown:this.accounts.filter(a=>a.enabled&&a.cooldownUntil>now).length,accounts:this.accounts.map(a=>({accountId:a.id,state:!a.enabled?'unavailable':a.cooldownUntil>now?'cooldown':a.failures>=3?'unavailable':'ready',consecutiveFailures:a.failures,lastUsedAt:a.lastUsedAt||undefined}))};}
  listModels(): GeminiModel[] { return this.accounts.flatMap(account=>account.client.models); }
  async run<T>(operation: (account: Account) => Promise<T>): Promise<T> { const account=this.balancer.pick(this.accounts); const lease=this.leases.get(account.id)??new AccountLease(); this.leases.set(account.id,lease); return lease.run(async()=>{try{const result=await operation(account);account.failures=0;account.cooldownUntil=0;account.lastUsedAt=Date.now();return result;}catch(error){account.failures++;account.lastUsedAt=Date.now();account.cooldownUntil=Date.now()+Math.min(30000,1000*2**account.failures);throw error;}}); }
  async runWithRetry<T>(operation:(account:Account)=>Promise<T>, attempts=this.accounts.length):Promise<T>{let last:unknown;for(let i=0;i<Math.max(1,attempts);i++){try{return await this.run(operation);}catch(error){last=error;}}throw last instanceof Error?last:new Error(String(last));}
}
