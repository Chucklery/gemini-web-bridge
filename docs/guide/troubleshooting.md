# Troubleshooting

## Browser not found

Install Chrome or Edge, or set GEMINI_BROWSER_CHANNEL / GEMINI_BROWSER_EXECUTABLE_PATH. You may explicitly switch to GEMINI_AUTH_MODE=env as a rescue mode. Do not disable browser security features to bypass a login block.

## auth_required or bootstrap failure

Run npm run auth -- status, then npm run auth -- refresh. If Google requests interactive verification, run npm run auth -- login and complete it in the visible window. Check the system clock, proxy, and browser version.

## SSE disconnects or client reconnects

Disable buffering in the reverse proxy and set its read timeout above GEMINI_STREAM_STALL_TIMEOUT_MS. A heartbeat keeps an open connection alive; it cannot make a stalled upstream run forever.

## A request fails without enough context

Report a redacted configuration summary, Node.js version, operating system, and reproduction steps. Never upload cookies, API keys, account emails, profiles, screenshots, or request bodies.
