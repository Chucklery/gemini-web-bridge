import type { AccountPool } from '../accounts/pool.js';
import { contentToText, type ChatRequest } from '../shared/types.js';
export class GoogleAdapter {
  constructor(private readonly pool: AccountPool) {}
  async generate(input: ChatRequest): Promise<{text:string}> { const prompt=input.messages.map(m=>contentToText(m.content)).join('\n'); return this.pool.run(async a=>{let text=''; await a.client.generate({prompt,model:input.model},e=>{if(e.type==='text')text+=e.text??''}); return {text};}); }
}
