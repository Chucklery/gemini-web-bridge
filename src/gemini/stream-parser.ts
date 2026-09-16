import { TextDecoder } from 'node:util';
import type { GeminiEvent } from './client.js';
import { parseGeminiResponse } from './response-parser.js';
export class GeminiStreamParser {
  private buffer=''; private previous=''; private previousThought=''; private readonly decoder=new TextDecoder();
  push(chunk:Uint8Array):GeminiEvent[]{this.buffer+=this.decoder.decode(chunk,{stream:true});const lines=this.buffer.split('\n');this.buffer=lines.pop()??'';return lines.flatMap(line=>line.trim()?this.normalize(parseGeminiResponse(line).events):[]);}
  finish():GeminiEvent[]{if(!this.buffer.trim())return[{type:'done'}];const events=this.normalize(parseGeminiResponse(this.buffer).events);this.buffer='';events.push({type:'done'});return events;}
  private normalize(events:GeminiEvent[]):GeminiEvent[]{return events.filter(event=>{if(event.type==='done')return false;if(event.type!=='text'&&event.type!=='thought')return true;const current=event.text??'';const previous=event.type==='thought'?this.previousThought:this.previous;const delta=current.startsWith(previous)?current.slice(previous.length):current;if(event.type==='thought')this.previousThought=current;else this.previous=current;if(!delta)return false;event.text=delta;return true;});}
}
