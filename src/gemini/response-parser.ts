import type { ConversationSnapshot, GeminiEvent, GeminiResource } from './client.js';
import { parseRpcRecords } from './rpc.js';
export function parseGeminiResponse(text: string): {events:GeminiEvent[];session:ConversationSnapshot} {
  const events:GeminiEvent[]=[];let session:ConversationSnapshot={cid:'',rid:'',rcid:''};
  for(const record of parseRpcRecords(text)){
    if(record[0]==='er'){events.push({type:'error',error:new Error('Gemini RPC error')});continue;}
    if(record[0]!=='wrb.fr'||typeof record[2]!=='string')continue;
    let payload:unknown;try{payload=JSON.parse(record[2]);}catch{continue;}if(!Array.isArray(payload))continue;
    const ids=payload[1];if(Array.isArray(ids)){session={cid:stringAt(ids,0)||session.cid,rid:stringAt(ids,1)||session.rid,rcid:session.rcid};events.push({type:'session',session});}
    const candidates=payload[4];if(!Array.isArray(candidates))continue;
    for(const candidate of candidates){if(!Array.isArray(candidate)||!stringAt(candidate,0).startsWith('rc_'))continue;const rcid=stringAt(candidate,0);if(rcid!==session.rcid){session={...session,rcid};events.push({type:'session',session});}const content=candidate[1];const value=Array.isArray(content)?stringAt(content,0):'';if(value)events.push({type:'text',text:value});const thought=pathString(candidate,[37,0,0]);if(thought)events.push({type:'thought',text:thought});const phase=pathNumber(candidate,[8,0]);if(phase!==undefined)events.push({type:'phase',phase});for(const resource of extractResources(candidate)) events.push({ type: 'resource', resource });}
  }
  events.push({type:'done',session});return {events,session};
}
function stringAt(value:unknown,index:number):string{if(!Array.isArray(value))return '';return typeof value[index]==='string'?value[index] as string:'';}
function pathString(value:unknown,path:(number|string)[]):string{let current=value;for(const index of path){if((typeof index==='number'&&!Array.isArray(current))||(typeof index==='string'&&(typeof current!=='object'||current===null)))return '';current=(current as Record<string|number,unknown>)[index];}return typeof current==='string'?current:'';}
function pathNumber(value:unknown,path:number[]):number|undefined{let current=value;for(const index of path){if(!Array.isArray(current))return undefined;current=current[index];}return typeof current==='number'?current:undefined;}
function extractResources(candidate: unknown[]): GeminiResource[] {
  const resources: GeminiResource[] = [];
  const webImages = pathValue(candidate, [12, 1]);
  if (Array.isArray(webImages)) for (const item of webImages) { const url = pathString(item, [0, 0, 0]); if (url) resources.push({ kind: 'web_image', url, name: pathString(item, [0, 4]) || undefined, mimeType: 'image/*' }); }
  const generatedImages = [...asArray(pathValue(candidate, [12, 7, 0])), ...asArray(pathValue(candidate, [12, 0, '8', 0]))];
  for (const item of generatedImages) { const url = pathString(item, [0, 3, 3]); if (url) resources.push({ kind: 'generated_image', url, name: pathString(item, [0, 3, 2]) || undefined, mimeType: 'image/*' }); }
  const videoInfo = pathValue(candidate, [12, 59, 0, 0, 0]);
  const videoUrl = pathString(videoInfo, [0, 7, 1]);
  if (videoUrl) resources.push({ kind: 'generated_video', url: videoUrl, mimeType: 'video/*' });
  return resources;
}
function pathValue(value:unknown,path:(number|string)[]):unknown{let current=value;for(const index of path){if((typeof index==='number'&&!Array.isArray(current))||(typeof index==='string'&&(typeof current!=='object'||current===null)))return undefined;current=(current as Record<string|number,unknown>)[index];}return current;}
function asArray(value:unknown):unknown[]{return Array.isArray(value)?value:[];}
