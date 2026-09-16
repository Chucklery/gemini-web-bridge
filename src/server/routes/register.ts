import type { FastifyInstance } from 'fastify';
import type { AccountPool } from '../../accounts/pool.js';
export function registerRoutes(app: FastifyInstance, _pool?: AccountPool): void {
  app.get('/v1/models', async () => ({ object: 'list', data: [] }));
}
