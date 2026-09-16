# Gemini Web2API (TypeScript)

Node.js 24+ service exposing Gemini Web through OpenAI, Anthropic and Google compatible HTTP endpoints.

Run:

    npm install
    npm run build
    GEMINI_COOKIES='[{"name":"SID","value":"...","domain":"gemini.google.com"}]' node dist/cli/server.js

Optional environment variables: HOST, PORT, API_KEY, GEMINI_PROXY.

The transport boundary is GeminiTransport. UndiciTransport provides HTTP, while FingerprintTransport adds browser headers, proxy support and the Cookie jar. Account requests are serialized per account to preserve Gemini conversation state.
