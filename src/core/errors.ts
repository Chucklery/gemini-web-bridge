export type ProviderErrorKind = 'authentication' | 'rate_limit' | 'quota_exhausted' | 'upstream_unavailable' | 'protocol_changed' | 'unsupported_feature' | 'invalid_request' | 'aborted';
export type AccountAction = 'none' | 'cooldown' | 'disable' | 'refresh';

export class ProviderError extends Error {
  constructor(message: string, readonly kind: ProviderErrorKind, readonly retryable: boolean, readonly accountAction: AccountAction = 'none', options?: ErrorOptions) {
    super(message, options);
    this.name = 'ProviderError';
  }
}
