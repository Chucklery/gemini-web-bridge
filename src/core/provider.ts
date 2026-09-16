import type { GenerationRequest } from './generation.js';
import type { GenerationEvent } from './events.js';

export type ProviderId = 'gemini-web' | 'chatgpt-web' | 'claude-web';
export interface ModelInfo { id: string; displayName?: string; provider: ProviderId; capabilities?: string[] }
export interface ProviderCapabilities { streaming: boolean; tools: boolean; multimodal: boolean; maxConcurrency: number }

export interface ProviderClient {
  readonly provider: ProviderId;
  readonly capabilities: ProviderCapabilities;
  listModels(signal?: AbortSignal): Promise<ModelInfo[]>;
  generate(request: GenerationRequest, signal?: AbortSignal): AsyncIterable<GenerationEvent>;
  refresh?(): Promise<void>;
  close?(): Promise<void>;
}

export interface ProviderAccount { id: string; provider: ProviderId; client: ProviderClient; }
