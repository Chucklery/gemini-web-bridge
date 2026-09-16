import type { AccountPool } from '../accounts/pool.js';
import { contentToText, type ChatRequest } from '../shared/types.js';
export class OpenAIAdapter {
  constructor(private readonly pool: AccountPool) {}
  async complete(input: ChatRequest): Promise<{content:string; model:string}> {
    const prompt=input.messages.map(m=>m.role+': '+contentToText(m.content)).join('\n');
    return this.pool.run(async account=>{let content=''; await account.client.generate({prompt,model:input.model},e=>{if(e.type==='text')content+=e.text??''}); return {content,model:input.model??'gemini'};});
  }
}
