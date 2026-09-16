export class GeminiProtocolError extends Error {
  readonly kind: 'authentication' | 'protocol' | 'network';
  constructor(message: string, readonly status?: number, readonly retryable = false, options?: ErrorOptions) { super(message, options); this.kind = status === 401 || status === 403 ? 'authentication' : 'protocol'; }
}
