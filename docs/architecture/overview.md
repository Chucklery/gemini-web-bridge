# Architecture overview

The main request path is:

~~~~text
HTTP route → API adapter → AccountPool → Account → GeminiClient
                                           ↓
                              Transport + Gemini RPC/stream parser
~~~~

## Responsibilities

| Layer | Directory | Responsibility |
| --- | --- | --- |
| Ingress | src/server/ | Fastify lifecycle, auth, routes, and SSE output |
| Adapter | src/adapters/ | Map OpenAI/Anthropic/Google requests to internal prompts |
| Scheduling | src/accounts/ | Account selection, serialized leases, cooldowns, and retries |
| Provider | src/gemini/ | Bootstrap, model catalog, request construction, RPC, and stream parsing |
| Transport | src/transport/ | Cookies, proxy, HTTP requests, and streaming |
| Authentication | src/auth/ and src/browser-auth/ | Auth sources, isolated profile, recovery, and redaction |

## Request lifecycle

1. Fastify checks the API key; /health is exempt.
2. The route parses the external protocol and calls its adapter.
3. AccountPool selects a healthy account and serializes work for that account.
4. GeminiClient bootstraps when needed and builds the Gemini Web RPC request.
5. The stream parser converts upstream records into text, session, and done events.
6. The route encodes those events into the requested compatibility response.

This is a Gemini Web client behind a multi-protocol HTTP facade, not a ChatGPT Web client.
