import type { AccountPool } from '../accounts/pool.js';
import { googleContentsToPrompt } from '../shared/types.js';
import { validateUploads, type GeminiUpload } from '../gemini/upload.js';

export interface GoogleGenerateRequest {
  model?: string;
  contents: unknown[];
  systemInstruction?: unknown;
}

export class GoogleAdapter {
  constructor(private readonly pool: AccountPool) {}
  async generate(input: GoogleGenerateRequest): Promise<{ text: string; finishReason: 'STOP' }> {
    const prompt = googleContentsToPrompt(input.contents, input.systemInstruction);
    const inlineData = googleInlineData(input.contents);
    if (!prompt && !inlineData.length) throw new Error('Google contents contain no text or supported inlineData parts');
    return this.pool.runWithRetry(async account => {
      validateUploads(inlineData);
      const attachments = [];
      for (const upload of inlineData) attachments.push(await account.client.upload(upload));
      let text = '';
      await account.client.generate({ prompt, model: input.model, attachments }, event => {
        if (event.type === 'text') text += event.text ?? '';
        else if (event.type === 'resource') throw new Error(`Google response resource is not supported by this adapter: ${event.resource?.kind ?? 'unknown'}`);
      });
      return { text, finishReason: 'STOP' as const };
    });
  }
}

function googleInlineData(contents: unknown[]): GeminiUpload[] {
  const uploads: GeminiUpload[] = [];
  for (const value of contents) {
    const parts = typeof value === 'object' && value !== null && 'parts' in value ? (value as { parts?: unknown[] }).parts ?? [] : [];
    for (const part of parts) {
      if (typeof part === 'object' && part !== null && 'fileData' in part) throw new Error('Google fileData is not supported; use inlineData');
      if (typeof part !== 'object' || part === null || !('inlineData' in part)) continue;
      const data = (part as { inlineData?: { mimeType?: unknown; data?: unknown } }).inlineData;
      if (typeof data?.mimeType !== 'string' || typeof data.data !== 'string') throw new Error('Google inlineData requires mimeType and base64 data');
      uploads.push({ name: `upload-${uploads.length + 1}`, mimeType: data.mimeType, data: Buffer.from(data.data, 'base64') });
    }
  }
  return uploads;
}
