import { describe, expect, it } from 'vitest';
import { AccountLease } from '../src/accounts/account.js';
describe('AccountLease',()=>{it('serializes operations for one account',async()=>{const lease=new AccountLease();let active=0,max=0;const work=()=>lease.run(async()=>{active++;max=Math.max(max,active);await new Promise(r=>setTimeout(r,10));active--;});await Promise.all([work(),work(),work()]);expect(max).toBe(1);});});
