import type { FastifyReply, FastifyRequest } from 'fastify';
export async function requireApiKey(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const expected = process.env.API_KEY;
  if (!expected) return;
  const supplied = request.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (supplied !== expected) { await reply.code(401).send({ error: { message: 'Invalid API key', type: 'authentication_error' } }); }
}
