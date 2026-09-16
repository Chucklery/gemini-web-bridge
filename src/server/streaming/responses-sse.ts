import type { FastifyReply } from 'fastify';
import { randomUUID } from 'node:crypto';

export interface ResponsesEvent {
  type: string;
  [key: string]: unknown;
}

export class ResponsesSse {
  private sequence = 0;
  private ended = false;

  constructor(private readonly reply: FastifyReply, readonly responseId = `resp_${randomUUID().replaceAll('-', '')}`) {
    reply.hijack();
    reply.raw.writeHead(200, {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    });
  }

  write(event: ResponsesEvent): void {
    if (this.ended) return;
    const value = { sequence_number: this.sequence++, response_id: this.responseId, ...event };
    this.reply.raw.write(`event: ${event.type}\ndata: ${JSON.stringify(value)}\n\n`);
  }

  heartbeat(): void { this.write({ type: 'response.heartbeat' }); }

  complete(): void {
    if (this.ended) return;
    this.write({ type: 'response.completed', response: { id: this.responseId, object: 'response', status: 'completed' } });
    this.reply.raw.write('data: [DONE]\n\n');
    this.end();
  }

  fail(message: string): void {
    if (this.ended) return;
    this.write({ type: 'response.failed', response: { id: this.responseId, object: 'response', status: 'failed', error: { message } } });
    this.reply.raw.write('data: [DONE]\n\n');
    this.end();
  }

  end(): void { if (!this.ended) { this.ended = true; this.reply.raw.end(); } }
}
