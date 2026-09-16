import type { GeminiClient } from '../gemini/client.js';
export interface Account { id:string; client:GeminiClient; enabled:boolean; failures:number; lastUsedAt:number; cooldownUntil:number; authState?: 'ready' | 'auth_required' | 'refreshing' | 'disabled'; refresh?: () => Promise<GeminiClient>; }
export class AccountLease {
  private tail=Promise.resolve();
  async run<T>(operation:()=>Promise<T>):Promise<T>{let release!:()=>void;const previous=this.tail;this.tail=new Promise<void>(resolve=>{release=resolve});await previous;try{return await operation();}finally{release();}}
}
