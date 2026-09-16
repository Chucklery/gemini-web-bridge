const SECRET_KEYS = /cookie|authorization|api[-_]?key|token|sid|password|secret/i;

export function redact(value: unknown): unknown {
  if (typeof value === 'string') return value.replace(/(SID|SAPISID|APISID)=([^;\s]+)/gi, '$1=[REDACTED]');
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== 'object') return value;
  const output: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) output[key] = SECRET_KEYS.test(key) ? '[REDACTED]' : redact(item);
  return output;
}

export function safeError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  return new Error(String(redact(message)));
}
