import type { FastifyInstance } from 'fastify';
import type { AccountPool } from '../../../accounts/pool.js';
import { z } from 'zod';
import { generate } from '../shared.js';
import { ResponsesSse } from '../../streaming/responses-sse.js';

const schema = z.object({ model: z.string().optional(), input: z.union([z.string(), z.array(z.unknown())]), stream: z.boolean().optional() });

export function registerResponses(app: FastifyInstance, pool?: AccountPool): void {
  app.post('/v1/responses', async (req, reply) => {
    const body = schema.parse(req.body);
    const prompt = typeof body.input === 'string' ? body.input : JSON.stringify(body.input);
    if (!body.stream) {
      const text = await generate(pool, prompt, body.model, reply);
      return { id: 'resp-gemini', object: 'response', output: [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text }] }] };
    }
    if (!pool) return reply.code(503).send({ error: { message: 'No account pool configured', type: 'server_error' } });

    const stream = new ResponsesSse(reply);
    const controller = new AbortController();
    const onClose = () => controller.abort(new Error('Client disconnected'));
    req.raw.once('close', onClose);
    const heartbeat = setInterval(() => stream.heartbeat(), 2000);
    let text = '';
    stream.write({ type: 'response.created', response: { id: stream.responseId, object: 'response', status: 'in_progress' } });
    stream.write({ type: 'response.output_item.added', output_index: 0, item: { type: 'message', role: 'assistant', content: [] } });
    try {
      await pool.run(async account => account.client.generate({ prompt, model: body.model }, event => {
        if (event.type !== 'text' || !event.text) return;
        text += event.text;
        stream.write({ type: 'response.output_text.delta', output_index: 0, item_id: `${stream.responseId}_item`, delta: event.text });
      }, controller.signal));
      stream.write({ type: 'response.output_text.done', output_index: 0, text });
      stream.write({ type: 'response.content_part.done', output_index: 0 });
      stream.write({ type: 'response.output_item.done', output_index: 0 });
      stream.complete();
    } catch (error) {
      if (!controller.signal.aborted) stream.fail(error instanceof Error ? error.message : 'Gemini request failed');
      else stream.end();
    } finally {
      clearInterval(heartbeat);
      req.raw.off('close', onClose);
    }
    return reply;
  });
}
