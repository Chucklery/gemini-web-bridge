import { describe, expect, it, afterEach } from 'vitest';
import { createApp } from '../src/server/app.js';
describe('HTTP server', () => {
  afterEach(() => { delete process.env.API_KEY; });
  it('returns health and validates chat requests', async () => {
    const app=createApp();
    expect((await app.inject({method:'GET',url:'/health'})).json()).toMatchObject({status:'ok',accounts:{total:0,available:0}});
    const response=await app.inject({method:'POST',url:'/v1/chat/completions',payload:{messages:[]}});
    expect(response.statusCode).toBe(400); await app.close();
  });
  it('protects routes when API_KEY is configured', async () => {
    process.env.API_KEY='secret'; const app=createApp();
    expect((await app.inject({method:'GET',url:'/v1/models'})).statusCode).toBe(401);
    expect((await app.inject({method:'GET',url:'/v1/models',headers:{authorization:'Bearer secret'}})).statusCode).toBe(200); await app.close();
  });
});
