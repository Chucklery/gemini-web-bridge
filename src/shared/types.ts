export interface InputMessage { role: string; content: unknown }
export interface ChatRequest { model?: string; messages: InputMessage[]; stream?: boolean }
export function contentToText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.map(part => contentToText(part)).filter(Boolean).join('');
  if (typeof content === 'object' && content !== null && 'text' in content) {
    const text = (content as { text: unknown }).text;
    return typeof text === 'string' ? text : '';
  }
  return content == null ? '' : String(content);
}

export interface GoogleContent {
  role?: string;
  parts?: unknown[];
}

/** Convert the text subset of Google's Content shape to the internal prompt. */
export function googleContentsToPrompt(contents: unknown[], systemInstruction?: unknown): string {
  const sections: string[] = [];
  const systemText = googlePartToText(systemInstruction);
  if (systemText) sections.push(`system: ${systemText}`);

  for (const raw of contents) {
    if (typeof raw === 'string') {
      if (raw) sections.push(raw);
      continue;
    }
    if (!isGoogleContent(raw)) {
      const text = contentToText(raw);
      if (text) sections.push(text);
      continue;
    }
    const text = googlePartToText(raw.parts ?? raw);
    if (text) sections.push(`${raw.role ?? 'user'}: ${text}`);
  }
  return sections.join('\n');
}

function isGoogleContent(value: unknown): value is GoogleContent {
  return typeof value === 'object' && value !== null && ('parts' in value || 'role' in value);
}

function googlePartToText(value: unknown): string {
  if (Array.isArray(value)) return value.map(googlePartToText).filter(Boolean).join('');
  if (typeof value === 'object' && value !== null && 'parts' in value) {
    return googlePartToText((value as { parts: unknown }).parts);
  }
  return contentToText(value);
}
