import type { ConversationSnapshot, GeminiEvent } from './client.js';
import { parseRpcRecords } from './rpc.js';
export function parseGeminiResponse(text: string): {events:GeminiEvent[];session:ConversationSnapshot} {
  const events:GeminiEvent[]=[];let session:ConversationSnapshot={cid:'',rid:'',rcid:''};
  for(const record of parseRpcRecords(text)){
    if(record[0]==='er'){events.push({type:'error',error:new Error('Gemini RPC error')});continue;}
    if(record[0]!=='wrb.fr'||typeof record[2]!=='string')continue;
    let payload:unknown;try{payload=JSON.parse(record[2]);}catch{continue;}if(!Array.isArray(payload))continue;
    const ids=payload[1];if(Array.isArray(ids)){session={cid:stringAt(ids,0)||session.cid,rid:stringAt(ids,1)||session.rid,rcid:session.rcid};events.push({type:'session',session});}
    const candidates=payload[4];if(!Array.isArray(candidates))continue;
    for(const candidate of candidates){if(!Array.isArray(candidate)||!stringAt(candidate,0).startsWith('rc_'))continue;const rcid=stringAt(candidate,0);if(rcid!==session.rcid){session={...session,rcid};events.push({type:'session',session});}const content=candidate[1];const value=Array.isArray(content)?stringAt(content,0):'';if(value)events.push({type:'text',text:value});}
  }
  events.push({type:'done',session});return {events,session};
}
function stringAt(value:unknown,index:number):string{if(!Array.isArray(value))return '';return typeof value[index]==='string'?value[index] as string:'';}
