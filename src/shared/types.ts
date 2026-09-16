export interface InputMessage { role: string; content: unknown }
export interface ChatRequest { model?: string; messages: InputMessage[]; stream?: boolean }
export function contentToText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.map(part => typeof part === 'string' ? part : typeof part === 'object' && part !== null && 'text' in part ? String((part as {text: unknown}).text) : '').join('');
  return content == null ? '' : String(content);
}
