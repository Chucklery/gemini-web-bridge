import type { FastifyReply } from 'fastify';
import type { AccountPool } from '../../accounts/pool.js';
export async function generate(pool:AccountPool|undefined,prompt:string,model?:string,reply?:FastifyReply):Promise<string>{
  if(!pool){if(reply)await reply.code(503).send({error:{message:'No account pool configured',type:'server_error'}});return '';}
  return pool.runWithRetry(async account=>{let text='';await account.client.generate({prompt,model},event=>{if(event.type==='text')text+=event.text??''});return text;});
}
