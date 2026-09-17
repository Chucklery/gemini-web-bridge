import type { GeminiClient, GeminiEvent } from '../../gemini/client.js';
import { GeminiSession } from '../../gemini/session.js';
import type { GenerationRequest } from '../../core/generation.js';
import type { GenerationEvent } from '../../core/events.js';
import type { ModelInfo, ProviderCapabilities, ProviderClient } from '../../core/provider.js';

export class GeminiProviderClient implements ProviderClient {
  readonly provider = 'gemini-web' as const;
  readonly capabilities: ProviderCapabilities = { streaming: true, tools: false, multimodal: true, outputResources: [], maxConcurrency: 1 };
  private readonly session: GeminiSession;
  constructor(private readonly client: GeminiClient) { this.session = new GeminiSession(); }

  async listModels(signal?: AbortSignal): Promise<ModelInfo[]> {
    if (!this.client.currentBootstrap) await this.client.init(signal);
    return this.client.models.map(model => ({ id: model.name, displayName: model.displayName, provider: this.provider, capabilities: model.capabilities }));
  }

  async *generate(request: GenerationRequest, signal?: AbortSignal): AsyncIterable<GenerationEvent> {
    const prompt = request.messages.flatMap(message => message.content.filter(block => block.type === 'text').map(block => `${message.role}: ${block.text}`)).join('\n');
    yield { type: 'message_start' };
    const events: GeminiEvent[] = [];
    let failure: Error | undefined;
    await this.session.generate(this.client, { prompt, model: request.model }, event => events.push(event), signal).catch(error => { failure = error instanceof Error ? error : new Error(String(error)); });
    for (const event of events) {
      if (event.type === 'text') yield { type: 'text_delta', text: event.text ?? '' };
      else if (event.type === 'thought') yield { type: 'reasoning_delta', text: event.text ?? '' };
    }
    yield failure ? { type: 'error', error: failure } : { type: 'completed' };
  }
}
