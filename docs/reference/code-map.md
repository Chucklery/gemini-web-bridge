# Code map

~~~~text
src/auth/          Cookies, auth policies, sessions, and redaction
src/browser-auth/  System browser discovery, profiles, login flow, and explicit Chrome import
src/accounts/      Accounts, leases, balancer, and account pool
src/gemini/        Gemini Web bootstrap, RPC, request, and response parsing
src/transport/     Undici, proxy, and browser-fingerprint transport
src/server/        Fastify app, routes, middleware, and SSE
src/adapters/      Compatibility protocol to Gemini prompt mapping
src/core/          Shared generation contracts
tests/             Unit and API tests
docs/              Developer and architecture documentation
~~~~

When changing authentication, streaming, or credential handling, update the matching guide and add failure, cancellation, and redaction tests.
