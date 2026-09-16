import type { FastifyInstance } from 'fastify';
import type { AccountPool } from '../../../accounts/pool.js';
import { z } from 'zod';
import { contentToText } from '../../../shared/types.js';

const schema = z.object({ model: z.string().optional(), messages: z.array(z.object({ role: z.string(), content: z.unknown() })).min(1), stream: z.boolean().optional() });
const sseHeaders = { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache, no-transform', connection: 'keep-alive', 'x-accel-buffering': 'no' };

export function registerChatCompletions(app: FastifyInstance, pool?: AccountPool): void {
  app.post('/v1/chat/completions', async (req, reply) => {
    const body = schema.parse(req.body);
    if (!pool) return reply.code(503).send({ error: { message: 'No account pool configured', type: 'server_error' } });
    const prompt = body.messages.map(message => `${message.role}: ${contentToText(message.content)}`).join('\n');
    if (!body.stream) {
      const text = await pool.runWithRetry(async account => { let output = ''; await account.client.generate({ prompt, model: body.model }, event => { if (event.type === 'text') output += event.text ?? ''; }); return output; });
      return { id: 'chatcmpl-gemini', object: 'chat.completion', choices: [{ index: 0, message: { role: 'assistant', content: text }, finish_reason: 'stop' }] };
    }
    reply.hijack(); reply.raw.writeHead(200, sseHeaders);
    const controller = new AbortController(); let clientDisconnected = false;
    const onClose = () => { clientDisconnected = true; controller.abort(new Error('Client disconnected')); };
    req.raw.once('close', onClose);
    const heartbeat = setInterval(() => reply.raw.write('event: response.heartbeat\ndata: {"type":"response.heartbeat"}\n\n'), Number(process.env.GEMINI_SSE_HEARTBEAT_MS ?? 2000));
    const stall = setTimeout(() => controller.abort(new Error('Gemini stream stalled')), Number(process.env.GEMINI_STREAM_STALL_TIMEOUT_MS ?? 120000));
    try {
      await pool.run(account => account.client.generate({ prompt, model: body.model }, event => { if (event.type === 'text') reply.raw.write(`data: ${JSON.stringify({ id: 'chatcmpl-gemini', object: 'chat.completion.chunk', choices: [{ index: 0, delta: { content: event.text ?? '' } }] })}\n\n`); }, controller.signal));
      reply.raw.write('data: [DONE]\n\n'); reply.raw.end();
    } catch (error) {
      if (!clientDisconnected) reply.raw.write(`data: ${JSON.stringify({ error: { message: error instanceof Error ? error.message : 'Gemini request failed', type: 'server_error' } })}\n\ndata: [DONE]\n\n`);
      reply.raw.end();
    } finally { clearInterval(heartbeat); clearTimeout(stall); req.raw.off('close', onClose); }
    return reply;
  });
}
