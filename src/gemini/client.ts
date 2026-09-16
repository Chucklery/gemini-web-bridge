import { GeminiProtocolError } from '../shared/errors.js';
import type { GeminiTransport } from '../transport/transport.js';
import type { GeminiBootstrap } from './models.js';
import { GeminiRequestBuilder } from './request-builder.js';
import { GeminiStreamParser } from './stream-parser.js';
import { ENDPOINTS, formBody, parseRpcRecords } from './rpc.js';
import { parseModelCatalog } from './models.js';

export interface ConversationSnapshot { cid: string; rid: string; rcid: string; }
export interface GenerateRequest { prompt: string; model?: string; conversation?: ConversationSnapshot; }
export interface StatefulGenerateRequest extends Omit<GenerateRequest,'conversation'> { conversation?: ConversationSnapshot | {snapshot():ConversationSnapshot;update(next:Partial<ConversationSnapshot>):void}; }
export interface GeminiEvent { type: 'text' | 'thought' | 'phase' | 'session' | 'done' | 'error'; text?: string; session?: ConversationSnapshot; phase?: number; error?: Error; }

const APP = 'https://gemini.google.com/app';

export class GeminiClient {
  private bootstrap?: GeminiBootstrap;
  constructor(private readonly transport: GeminiTransport, private readonly headers: Record<string, string> = {}) {}

  async init(signal?: AbortSignal): Promise<GeminiBootstrap> {
    const response = await this.transport.request({ method: 'GET', url: APP, headers: this.headers, signal });
    const html = await response.text();
    if (response.status !== 200) throw new GeminiProtocolError(`Gemini bootstrap returned HTTP ${response.status}`, response.status, response.status >= 500);
    const value = (pattern: RegExp) => { const match = html.match(pattern); return match?.slice(1).find(Boolean) ?? ''; };
    const bootstrap = { snlM0e: value(/"SNlM0e":"([^"]+)"/), bl: value(/"bl":"([^"]+)"|data-bl="([^"]+)"/), fsid: value(/"FdrFJe":"([^"]+)"|"f\.sid":"([^"]+)"/), models: [] };
    if (!bootstrap.snlM0e || !bootstrap.bl || !bootstrap.fsid) throw new GeminiProtocolError('Gemini bootstrap is missing dynamic parameters', html.includes('accounts.google.com') ? 401 : undefined, false);
    const catalog = await this.fetchModels(bootstrap, signal);
    this.bootstrap = { ...bootstrap, models: catalog };
    return this.bootstrap;
  }

  private async fetchModels(bootstrap: GeminiBootstrap, signal?: AbortSignal): Promise<GeminiBootstrap['models']> {
    const params = new URLSearchParams({rpcids:'otAQ7b','source-path':'/app',bl:bootstrap.bl,'f.sid':bootstrap.fsid,hl:'en',rt:'c'});
    const request = {method:'POST',url:ENDPOINTS.batch+'?'+params.toString(),headers:{...this.headers,'content-type':'application/x-www-form-urlencoded;charset=UTF-8'},body:formBody({'f.req':JSON.stringify([[['otAQ7b','[]',null,'generic']]]),at:bootstrap.snlM0e}),signal};
    const response=await this.transport.request(request); if(response.status!==200) throw new GeminiProtocolError('Gemini model catalog request failed',response.status,response.status>=500);
    const records=parseRpcRecords(await response.text());
    for(const record of records) if(record[0]==='wrb.fr'&&record[1]==='otAQ7b'&&typeof record[2]==='string') { try { const models=parseModelCatalog(JSON.parse(record[2])); if(models.length) return models; } catch {} }
    throw new GeminiProtocolError('Gemini model catalog contained no valid models',undefined,true);
  }

  get currentBootstrap(): GeminiBootstrap | undefined { return this.bootstrap; }
  get models(): GeminiBootstrap['models'] { return this.bootstrap?.models ?? []; }

  async generate(request: StatefulGenerateRequest, emit: (event: GeminiEvent) => void, signal?: AbortSignal): Promise<void> {
    const state=request.conversation && 'snapshot' in request.conversation ? request.conversation : undefined;
    const snapshot=state?.snapshot() ?? request.conversation;
    const bootstrap = this.bootstrap ?? await this.init(signal);
    const built = new GeminiRequestBuilder().build(bootstrap, {...request,conversation:snapshot} as GenerateRequest);
    const parser = new GeminiStreamParser();
    await this.transport.stream({ method: 'POST', url: built.url, headers: { ...this.headers, ...built.headers }, body: built.body, signal }, chunk => {
      for (const event of parser.push(chunk)) { if(state&&event.type==='session')state.update(event.session??{}); emit(event); }
    });
    for (const event of parser.finish()) { if(state&&event.type==='session')state.update(event.session??{}); emit(event); }
  }
}
