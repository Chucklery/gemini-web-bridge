import { describe, expect, it } from 'vitest';
import { parseModelCatalog } from '../src/gemini/models.js';
describe('Gemini model catalog', () => {
  it('maps otAQ7b rows to stable public model IDs', () => {
    const payload: unknown[] = []; payload[15] = [['hash',null,null,null,null,null,null,true,null,null,null,'Gemini Pro','desc',null,null,false,null,1]];
    const models=parseModelCatalog(payload);
    expect(models[0]).toMatchObject({name:'gemini-pro',hash:'hash',default:true,mode:1});
  });
});
