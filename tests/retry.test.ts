import {describe,expect,it} from 'vitest';
import {AccountPool} from '../src/accounts/pool.js';
import type {Account} from '../src/accounts/account.js';
function account(id:string):Account{return{id,enabled:true,failures:0,lastUsedAt:0,cooldownUntil:0,client:{} as Account['client']};}
describe('AccountPool retry',()=>{it('fails over after an account error',async()=>{const first=account('a');const second=account('b');const pool=new AccountPool([first,second]);let calls=0;const value=await pool.runWithRetry(async a=>{calls++;if(calls===1)throw new Error('temporary');return'ok';});expect(value).toBe('ok');expect(calls).toBe(2);expect(first.failures+second.failures).toBe(1);});});
