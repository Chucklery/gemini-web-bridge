import type { AccountPool } from '../accounts/pool.js';
import { googleContentsToPrompt } from '../shared/types.js';

export interface GoogleGenerateRequest {
  model?: string;
  contents: unknown[];
  systemInstruction?: unknown;
}

export class GoogleAdapter {
  constructor(private readonly pool: AccountPool) {}
  async generate(input: GoogleGenerateRequest): Promise<{ text: string; finishReason: 'STOP' }> {
    const prompt = googleContentsToPrompt(input.contents, input.systemInstruction);
    if (!prompt) throw new Error('Google contents contain no text parts');
    return this.pool.runWithRetry(async account => {
      let text = '';
      await account.client.generate({ prompt, model: input.model }, event => {
        if (event.type === 'text') text += event.text ?? '';
      });
      return { text, finishReason: 'STOP' as const };
    });
  }
}
