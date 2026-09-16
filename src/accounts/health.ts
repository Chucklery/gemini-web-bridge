import type {Account} from './account.js';
export function isHealthy(account:Account,maxFailures=3):boolean{return account.enabled&&account.failures<maxFailures&&account.cooldownUntil<=Date.now();}
export function markSuccess(account:Account):void{account.failures=0;account.cooldownUntil=0;account.lastUsedAt=Date.now();}
export function markFailure(account:Account,cooldownMs=1000):void{account.failures++;account.lastUsedAt=Date.now();account.cooldownUntil=Date.now()+Math.min(30000,cooldownMs*2**account.failures);}
