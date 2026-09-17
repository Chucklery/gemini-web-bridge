import type { AccountPool } from '../accounts/pool.js';
import { contentToText, type ChatRequest } from '../shared/types.js';
export class AnthropicAdapter {
  constructor(private readonly pool: AccountPool) {}
  async complete(input: ChatRequest): Promise<{content:string}> { const prompt=input.messages.map(m=>m.role+': '+contentToText(m.content)).join('\n'); return this.pool.runWithRetry(async a=>{let content=''; await a.client.generate({prompt,model:input.model},e=>{if(e.type==='text')content+=e.text??'';else if(e.type==='resource')throw new Error(`Anthropic response resource is not supported: ${e.resource?.kind??'unknown'}`);}); return {content};}); }
}
