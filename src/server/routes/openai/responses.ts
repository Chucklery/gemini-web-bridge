import type { FastifyInstance } from 'fastify';
import type { AccountPool } from '../../../accounts/pool.js';
import { z } from 'zod';
import { generate } from '../shared.js';
import { ResponsesSse } from '../../streaming/responses-sse.js';
import { ReplayJournal } from '../../streaming/replay-journal.js';
import { randomUUID } from 'node:crypto';

const schema = z.object({ model: z.string().optional(), input: z.union([z.string(), z.array(z.unknown())]), stream: z.boolean().optional() });

export function registerResponses(app: FastifyInstance, pool?: AccountPool): void {
  const journal = new ReplayJournal(Number(process.env.GEMINI_REPLAY_TTL_MS ?? 900000));
  app.post('/v1/responses', async (req, reply) => {
    const body = schema.parse(req.body);
    const prompt = typeof body.input === 'string' ? body.input : JSON.stringify(body.input);
    if (!body.stream) {
      const text = await generate(pool, prompt, body.model, reply);
      return { id: 'resp-gemini', object: 'response', output: [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text }] }] };
    }
    if (!pool) return reply.code(503).send({ error: { message: 'No account pool configured', type: 'server_error' } });

    const requestKey = String(req.headers['x-request-id'] ?? randomUUID());
    const started = journal.begin(requestKey);
    const stream = new ResponsesSse(reply, started.entry.responseId);
    if (!started.owner) {
      for (const event of journal.replay(started.entry)) stream.write(event);
      if (started.entry.running) await started.entry.done;
      stream.finishReplay(); return reply;
    }
    const controller = new AbortController();
    let clientDisconnected = false;
    const onClose = () => { clientDisconnected = true; controller.abort(new Error('Client disconnected')); };
    req.raw.once('close', onClose);
    const heartbeat = setInterval(() => { stream.heartbeat(); journal.append(started.entry, { type: 'response.heartbeat' }); }, Number(process.env.GEMINI_SSE_HEARTBEAT_MS ?? 2000));
    const stall = setTimeout(() => controller.abort(new Error('Gemini stream stalled')), Number(process.env.GEMINI_STREAM_STALL_TIMEOUT_MS ?? 120000));
    const write = (event: { type: string; [key: string]: unknown }) => { stream.write(event); journal.append(started.entry, event); };
    let text = '';
    write({ type: 'response.created', response: { id: stream.responseId, object: 'response', status: 'in_progress' } });
    write({ type: 'response.output_item.added', output_index: 0, item_id: `${stream.responseId}_item`, item: { type: 'message', role: 'assistant', content: [] } });
    write({ type: 'response.content_part.added', output_index: 0, item_id: `${stream.responseId}_item`, content_index: 0, part: { type: 'output_text', text: '' } });
    try {
      await pool.run(async account => account.client.generate({ prompt, model: body.model }, event => {
        if (event.type !== 'text' || !event.text) return;
        text += event.text;
        write({ type: 'response.output_text.delta', output_index: 0, item_id: `${stream.responseId}_item`, delta: event.text });
      }, controller.signal));
      write({ type: 'response.output_text.done', output_index: 0, item_id: `${stream.responseId}_item`, text });
      write({ type: 'response.content_part.done', output_index: 0, item_id: `${stream.responseId}_item`, content_index: 0 });
      write({ type: 'response.output_item.done', output_index: 0, item_id: `${stream.responseId}_item` });
      journal.append(started.entry, { type: 'response.completed', response: { id: stream.responseId, object: 'response', status: 'completed' } });
      stream.complete();
      journal.complete(started.entry);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gemini request failed';
      if (!clientDisconnected) { journal.append(started.entry, { type: 'response.failed', response: { id: stream.responseId, object: 'response', status: 'failed', error: { message } } }); stream.fail(message); }
      else stream.end();
      journal.fail(started.entry);
    } finally {
      clearInterval(heartbeat);
      clearTimeout(stall);
      req.raw.off('close', onClose);
    }
    return reply;
  });
}
