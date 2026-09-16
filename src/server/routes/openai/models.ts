import type {FastifyInstance} from 'fastify'; import type {AccountPool} from '../../../accounts/pool.js';
export function registerModels(app:FastifyInstance,pool?:AccountPool):void{app.get('/v1/models',async()=>({object:'list',data:(pool?.listModels()??[]).map(model=>({id:model.name,object:'model',owned_by:'google',created:0})),}));}
