export type GenerationEvent =
  | { type: 'message_start'; providerMetadata?: Record<string, unknown> }
  | { type: 'text_delta'; text: string; providerMetadata?: Record<string, unknown> }
  | { type: 'reasoning_delta'; text: string; providerMetadata?: Record<string, unknown> }
  | { type: 'tool_call_delta'; id?: string; name?: string; arguments?: string; providerMetadata?: Record<string, unknown> }
  | { type: 'citation'; citation: unknown; providerMetadata?: Record<string, unknown> }
  | { type: 'usage'; inputTokens?: number; outputTokens?: number; providerMetadata?: Record<string, unknown> }
  | { type: 'completed'; providerMetadata?: Record<string, unknown> }
  | { type: 'error'; error: Error; providerMetadata?: Record<string, unknown> };
