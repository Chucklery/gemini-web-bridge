import Fastify, { type FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import type { AccountPool } from '../accounts/pool.js';
import { requireApiKey } from './middleware/auth.js';
import { registerErrorHandler } from './middleware/errors.js';
import { registerChatCompletions } from './routes/openai/chat-completions.js';
import { registerResponses } from './routes/openai/responses.js';
import { registerModels } from './routes/openai/models.js';
import { registerImages } from './routes/openai/images.js';
import { registerAnthropicMessages } from './routes/anthropic/messages.js';
import { registerCountTokens } from './routes/anthropic/count-tokens.js';
import { registerGenerateContent } from './routes/google/generate-content.js';
export function createApp(pool?:AccountPool):FastifyInstance {
  const app=Fastify({logger:false});
  registerErrorHandler(app);
  app.addHook('onRequest',requireApiKey);
  app.get('/health',async()=>({status:'ok',accounts:pool?.status()??{total:0,available:0,coolingDown:0,accounts:[]}}));
  registerChatCompletions(app,pool); registerResponses(app,pool); registerModels(app,pool);
  registerImages(app); registerAnthropicMessages(app,pool); registerCountTokens(app); registerGenerateContent(app,pool);
  return app;
}
