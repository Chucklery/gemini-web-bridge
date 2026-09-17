import type { FastifyInstance } from 'fastify';
import type { AccountPool } from '../../../accounts/pool.js';
import { z } from 'zod';
import { GoogleAdapter } from '../../../adapters/google.js';

const schema = z.object({
  contents: z.array(z.unknown()).min(1),
  systemInstruction: z.unknown().optional(),
  generationConfig: z.record(z.unknown()).optional(),
});

export function registerGenerateContent(app: FastifyInstance, pool?: AccountPool): void {
  app.post('/v1beta/models/:model\\:generateContent', async (req, reply) => {
    const body = schema.parse(req.body);
    if (!pool) return reply.code(503).send({ error: { message: 'No account pool configured', type: 'server_error' } });

    const model = (req.params as { model: string }).model;
    const result = await new GoogleAdapter(pool).generate({
      model,
      contents: body.contents,
      systemInstruction: body.systemInstruction,
    });
    return {
      candidates: [{ content: { role: 'model', parts: [{ text: result.text }] }, finishReason: result.finishReason }],
    };
  });
}
