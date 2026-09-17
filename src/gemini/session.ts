import type { ConversationSnapshot } from './client.js';
import type { GeminiClient, GeminiEvent, StatefulGenerateRequest } from './client.js';
export class ConversationState {
  private value:ConversationSnapshot={cid:'',rid:'',rcid:''};
  constructor(initial?:Partial<ConversationSnapshot>){if(initial)this.value={...this.value,...initial};}
  snapshot():ConversationSnapshot{return {...this.value};}
  update(next:Partial<ConversationSnapshot>):void{this.value={...this.value,...Object.fromEntries(Object.entries(next).filter(([,value])=>value))};}
}

/** Serializes requests that share one Gemini Web conversation. */
export class GeminiSession {
  private tail = Promise.resolve();
  readonly state: ConversationState;

  constructor(initial?: Partial<ConversationSnapshot>) { this.state = new ConversationState(initial); }
  snapshot(): ConversationSnapshot { return this.state.snapshot(); }
  update(next: Partial<ConversationSnapshot>): void { this.state.update(next); }

  async generate(client: GeminiClient, request: Omit<StatefulGenerateRequest, 'conversation'>, emit: (event: GeminiEvent) => void, signal?: AbortSignal): Promise<void> {
    let release!: () => void;
    const previous = this.tail;
    this.tail = new Promise<void>(resolve => { release = resolve; });
    await previous;
    try { await client.generate({ ...request, conversation: this.state }, emit, signal); }
    finally { release(); }
  }
}
