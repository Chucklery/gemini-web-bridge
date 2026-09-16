export type MessageRole = 'system' | 'developer' | 'user' | 'assistant' | 'tool';

export interface TextContent { type: 'text'; text: string }
export interface ImageContent { type: 'image'; mediaType?: string; data: string; }
export interface FileContent { type: 'file'; mediaType?: string; name?: string; data: string; }
export type ContentBlock = TextContent | ImageContent | FileContent;

export interface GenerationMessage {
  role: MessageRole;
  content: ContentBlock[];
  name?: string;
  toolCallId?: string;
}

export interface ToolDefinition { name: string; description?: string; inputSchema?: unknown }
export interface GenerationParameters {
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  stop?: string[];
}

export interface GenerationRequest {
  model?: string;
  messages: GenerationMessage[];
  tools?: ToolDefinition[];
  parameters?: GenerationParameters;
  responseFormat?: { type: 'text' | 'json'; schema?: unknown };
  providerOptions?: Record<string, unknown>;
}
