import { TextDecoder } from 'node:util';
import type { GeminiEvent } from './client.js';
import { parseGeminiResponse } from './response-parser.js';
export class GeminiStreamParser {
  private buffer=''; private previous=''; private previousThought=''; private readonly decoder=new TextDecoder();
  push(chunk:Uint8Array):GeminiEvent[]{this.buffer+=this.decoder.decode(chunk,{stream:true});return this.drain(false);}
  finish():GeminiEvent[]{this.buffer+=this.decoder.decode();const events=this.drain(true);events.push({type:'done'});return events;}
  private drain(final: boolean): GeminiEvent[] {
    const events: GeminiEvent[] = [];
    while (this.buffer) {
      const length = this.buffer.match(/^(?:\s*)(\d+)\n/);
      if (length) {
        const prefixEnd = length[0].length;
        const size = Number(length[1]);
        if (this.buffer.length < prefixEnd + size) break;
        const frame = this.buffer.slice(prefixEnd, prefixEnd + size);
        this.buffer = this.buffer.slice(prefixEnd + size);
        events.push(...this.normalize(parseGeminiResponse(frame).events));
        continue;
      }
      const newline = this.buffer.indexOf('\n');
      if (newline < 0) {
        if (!final) break;
        const line = this.buffer; this.buffer = '';
        events.push(...this.normalize(parseGeminiResponse(line).events));
        continue;
      }
      const line = this.buffer.slice(0, newline); this.buffer = this.buffer.slice(newline + 1);
      if (line.trim()) events.push(...this.normalize(parseGeminiResponse(line).events));
    }
    if (final && this.buffer.trim()) throw new Error('Incomplete Gemini stream frame');
    return events;
  }
  private normalize(events:GeminiEvent[]):GeminiEvent[]{return events.filter(event=>{if(event.type==='done')return false;if(event.type!=='text'&&event.type!=='thought')return true;const current=event.text??'';const previous=event.type==='thought'?this.previousThought:this.previous;const delta=current.startsWith(previous)?current.slice(previous.length):current;if(event.type==='thought')this.previousThought=current;else this.previous=current;if(!delta)return false;event.text=delta;return true;});}
}
