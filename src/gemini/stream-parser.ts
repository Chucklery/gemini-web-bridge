import { TextDecoder } from 'node:util';
import type { GeminiEvent } from './client.js';
import { parseGeminiResponse } from './response-parser.js';
export class GeminiStreamParser {
  private buffer = ''; private readonly decoder = new TextDecoder();
  push(chunk: Uint8Array): GeminiEvent[] { this.buffer += this.decoder.decode(chunk,{stream:true}); const lines=this.buffer.split('\n'); this.buffer=lines.pop()??''; const events:GeminiEvent[]=[]; for(const line of lines) if(line.trim()) events.push(...parseGeminiResponse(line).events.filter(e=>e.type!=='done')); return events; }
  finish(): GeminiEvent[] { if(!this.buffer.trim()) return [{type:'done'}]; const events=parseGeminiResponse(this.buffer).events; this.buffer=''; return events; }
}
