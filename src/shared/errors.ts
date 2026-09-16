export class GeminiProtocolError extends Error {
  constructor(message: string, readonly status?: number, readonly retryable = false, options?: ErrorOptions) { super(message, options); }
}
