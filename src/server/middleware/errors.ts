import type { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    if (reply.sent) return;
    if (error instanceof ZodError) { void reply.code(400).send({error:{message:error.message,type:'invalid_request_error'}}); return; }
    void reply.code(500).send({ error: { message: 'Internal server error', type: 'server_error' } });
  });
}
