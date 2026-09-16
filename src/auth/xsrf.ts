export function xsrfHeader(token: string): Record<string, string> { return { 'x-goog-authuser': '0', 'x-same-domain': '1', 'x-xsrf-token': token }; }
