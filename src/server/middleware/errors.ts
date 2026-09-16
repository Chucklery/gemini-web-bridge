import type { FastifyInstance } from 'fastify';
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    if (reply.sent) return;
    void reply.code(500).send({ error: { message: 'Internal server error', type: 'server_error' } });
  });
}
