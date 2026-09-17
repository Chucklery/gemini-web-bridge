import { GeminiProtocolError } from '../shared/errors.js';
export const ENDPOINTS={app:'https://gemini.google.com/app',batch:'https://gemini.google.com/_/BardChatUi/data/batchexecute',generate:'https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate',upload:'https://content-push.googleapis.com/upload'} as const;
export function formBody(fields:Record<string,string>):string{return new URLSearchParams(fields).toString();}
export function parseRpcRecords(input:string):unknown[][]{
  const normalized=input.replace(/^\s*\)\]\}'\s*/, '').trim();
  const framed=parseLengthPrefixedRecords(normalized);
  if(framed) return framed;

  const result:unknown[][]=[];
  for(const line of normalized.split('\n')){
    let value:unknown;
    try{value=JSON.parse(line.trim());}catch{continue;}
    appendRecords(result,value);
  }
  if(!result.length&&normalized)throw new GeminiProtocolError('No Gemini RPC records',undefined,true);
  return result;
}

function parseLengthPrefixedRecords(input:string):unknown[][]|undefined{
  if(!/^\d+\n/.test(input)) return undefined;
  const result:unknown[][]=[];
  let offset=0;
  while(offset<input.length){
    while(/\s/.test(input[offset]??'')) offset++;
    if(offset>=input.length) break;
    const marker=input.slice(offset).match(/^(\d+)\n/);
    if(!marker) throw new GeminiProtocolError('Invalid Gemini RPC frame marker',undefined,true);
    const length=Number(marker[1]);
    const start=offset+marker[0].length;
    const end=start+length;
    if(!Number.isSafeInteger(length)||end>input.length)throw new GeminiProtocolError('Incomplete Gemini RPC frame',undefined,true);
    try{appendRecords(result,JSON.parse(input.slice(start,end).trim()));}catch{ /* ignore malformed individual frames */ }
    offset=end;
  }
  if(!result.length&&input)throw new GeminiProtocolError('No Gemini RPC records',undefined,true);
  return result;
}

function appendRecords(result:unknown[][],value:unknown):void{
  if(!Array.isArray(value)) return;
  if(value.every(item=>Array.isArray(item))){
    for(const item of value) if(Array.isArray(item)) result.push(item);
  }else result.push(value);
}
