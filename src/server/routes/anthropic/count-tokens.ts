import type {FastifyInstance} from 'fastify';import {z} from 'zod';
const schema=z.object({messages:z.array(z.object({role:z.string(),content:z.unknown()})).min(1)});
export function registerCountTokens(app:FastifyInstance):void{app.post('/v1/messages/count_tokens',async(req)=>{const body=schema.parse(req.body);const serialized=JSON.stringify(body.messages);return {input_tokens:Math.ceil(serialized.length/4)};});}
