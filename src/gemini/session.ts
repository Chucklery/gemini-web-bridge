import type { ConversationSnapshot } from './client.js';
export class ConversationState {
  private value:ConversationSnapshot={cid:'',rid:'',rcid:''};
  constructor(initial?:Partial<ConversationSnapshot>){if(initial)this.value={...this.value,...initial};}
  snapshot():ConversationSnapshot{return {...this.value};}
  update(next:Partial<ConversationSnapshot>):void{this.value={...this.value,...Object.fromEntries(Object.entries(next).filter(([,value])=>value))};}
}
