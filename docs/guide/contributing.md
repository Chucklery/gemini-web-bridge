# Contributing

## Before you start

~~~~bash
npm install
npm run build
npm test
~~~~

Keep route, adapter, provider, transport, and authentication boundaries clear. Add tests for success, failure, cancellation, and retry paths. Credential-related changes also require redaction assertions.

## Checklist

- Never commit .env, cookies, API keys, browser profiles, or diagnostic screenshots.
- Do not read a user's daily browser profile during normal runtime, open an external CDP port, or fill account credentials. The explicit `auth import-chrome` path must remain limited to a temporary Cookie-database copy.
- Update the relevant documentation when behavior or configuration changes.
- Run npm run build, npm test, and npm run docs:build before submitting a pull request.
