# API usage

When API_KEY is non-empty, every endpoint except /health requires:

~~~~http
Authorization: Bearer <API_KEY>
~~~~

## OpenAI Chat Completions

~~~~bash
curl http://127.0.0.1:8787/v1/chat/completions \\
  -H 'Authorization: Bearer change-this-local-key' \\
  -H 'Content-Type: application/json' \\
  -d '{"model":"gemini-2.0-flash","messages":[{"role":"user","content":"Hello"}],"stream":true}'
~~~~

## OpenAI Responses

~~~~bash
curl http://127.0.0.1:8787/v1/responses \\
  -H 'Authorization: Bearer change-this-local-key' \\
  -H 'Content-Type: application/json' \\
  -d '{"model":"gemini-2.0-flash","input":"Describe this project","stream":true}'
~~~~

## Google and Anthropic

- POST /v1/messages: Anthropic Messages.
- POST /v1/messages/count_tokens: basic token estimate.
- POST /v1beta/models/:model:generateContent: Google Generate Content.

Protocol compatibility does not guarantee identical behavior. Models, context limits, rate limits, errors, and safety policies are controlled by Gemini Web; create contract tests before integration.
