import {describe,expect,it} from 'vitest';
import {AccountPool} from '../src/accounts/pool.js';
import type {Account} from '../src/accounts/account.js';
function account(id:string):Account{return{id,enabled:true,failures:0,lastUsedAt:0,cooldownUntil:0,client:{} as Account['client']};}
describe('account health',()=>{it('reports ready and cooldown accounts',()=>{const a=account('a');const b=account('b');b.cooldownUntil=Date.now()+1000;const status=new AccountPool([a,b]).status();expect(status.total).toBe(2);expect(status.available).toBe(1);expect(status.coolingDown).toBe(1);});});
