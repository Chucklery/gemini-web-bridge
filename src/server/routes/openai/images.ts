import type {FastifyInstance} from 'fastify';
export function registerImages(app:FastifyInstance):void{app.post('/v1/images/generations',async(_req,reply)=>reply.code(501).send({error:{message:'Image generation is not supported by Gemini Web',type:'not_implemented'}}));}
