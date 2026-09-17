# Gemini Web Bridge

Turn a Gemini Web session into a local HTTP service compatible with OpenAI, Anthropic, and Google Generative Language API clients.

**Documentation:** English (this file) · [简体中文](README.zh-CN.md)

> [!WARNING]
> This project uses the private Gemini Web session, not the official Google API, and is not affiliated with Google. Follow applicable Google terms, organizational policies, and local laws. Login cookies are account credentials: never commit or expose them.

## Status

The project is intended for local experiments and development. It currently supports:

- Node.js 24+, TypeScript, and Fastify.
- Gemini Web Cookie sessions and proxy configuration.
- OpenAI Chat Completions, Responses, and Models endpoints.
- Anthropic Messages and Count Tokens endpoints.
- Google `generateContent` compatibility endpoint.
- Streaming SSE, heartbeats, cancellation propagation, definite terminal states, and short-TTL event replay.
- A basic multi-account pool abstraction with per-account serialization.
- Optional login and recovery through an isolated system Chrome/Edge profile.

The browser is used only during initial setup or explicit authentication recovery. After a successful setup, the service reads the local auth state file and sends Gemini Web requests over HTTP; normal startup and requests do not launch a browser or execute frontend scripts.

Not supported yet: image generation, the official Gemini API key, and the complete multi-account CLI. Image endpoints return `501 Not Implemented`. Normal browser authentication does not download Chromium or read the daily browser profile; an explicit one-time Chrome Cookie import is available when Google blocks the isolated login window.

## Quick start

### Requirements

- Node.js 24 or newer
- A Google account; browser mode opens an isolated project-owned window for login

### Install and configure

```bash
git clone <your-fork-url>
cd gemini-web-bridge
npm install
cp .env.example .env
```

Edit `.env`. The default `auto` mode uses an isolated system Chrome/Edge profile:

```dotenv
GEMINI_AUTH_MODE=auto
GEMINI_AUTH_PROFILE=default
GEMINI_BROWSER_CHANNEL=auto
```

Run the login command once and complete sign-in in the visible window:

```bash
npm run auth -- login
```

The validated Cookie snapshot is saved as `gemini-auth-state.json` inside the account's private auth profile directory (`~/.gemini-web-bridge/browser-profiles/<hashed-account-id>/` by default). The file is created with owner-only permissions and is used on later service starts. `npm run auth -- refresh` explicitly reopens the browser to recover the session.

If the isolated window shows “Try using a different browser,” sign in to Gemini in the user's normal Chrome first, then run the one-time importer:

```bash
npm run auth -- import-chrome
```

The importer reads a temporary copy of Chrome's Cookie database, keeps only Google/Gemini cookies, and saves them to the project-owned auth state. It does not take over the daily browser or read passwords, verification codes, or page contents. If more than one Chrome profile is detected, `GEMINI_CHROME_PROFILE_NAME` is required; set it to `Profile 2` (using the actual local profile name) and retry. If copying fails while Chrome is open, fully quit Chrome and retry.

If no supported browser is available, explicitly use the compatibility `env` mode:

```dotenv
HOST=127.0.0.1
PORT=8787
API_KEY=change-this-local-key
GEMINI_AUTH_MODE=env
GEMINI_PROXY=
GEMINI_COOKIES='[{"name":"SID","value":"...","domain":".google.com","path":"/"},{"name":"SAPISID","value":"...","domain":".google.com","path":"/"},{"name":"APISID","value":"...","domain":".google.com","path":"/"}]'
```

Cookies must use their real `domain`, `path`, `secure`, `httpOnly`, and expiry attributes. Do not copy placeholder values. The `env` mode is an explicit rescue mode and keeps credentials in the process only.

### Start

```bash
npm run build
npm start
```

Check the service:

```bash
curl http://127.0.0.1:8787/health
curl -H 'Authorization: Bearer change-this-local-key' \
  http://127.0.0.1:8787/v1/models
```

You can also inspect auth status or generate a Codex Responses provider configuration:

```bash
npm run setup
npm run setup -- codex
npm run auth -- status
```

## API usage

When `API_KEY` is non-empty, all endpoints except `/health` require:

```http
Authorization: Bearer <API_KEY>
```

### OpenAI Chat Completions

```bash
curl http://127.0.0.1:8787/v1/chat/completions \
  -H 'Authorization: Bearer change-this-local-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "gemini-2.0-flash",
    "messages": [{"role": "user", "content": "你好"}],
    "stream": true
  }'
```

### OpenAI Responses

```bash
curl http://127.0.0.1:8787/v1/responses \
  -H 'Authorization: Bearer change-this-local-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "gemini-2.0-flash",
    "input": "介绍一下这个项目",
    "stream": true
  }'
```

### Compatibility endpoints

| Interface | Path | Status |
| --- | --- | --- |
| OpenAI Models | `GET /v1/models` | Supported |
| OpenAI Chat Completions | `POST /v1/chat/completions` | Supported, including SSE |
| OpenAI Responses | `POST /v1/responses` | Supported, including SSE |
| Anthropic Messages | `POST /v1/messages` | Supported |
| Anthropic Count Tokens | `POST /v1/messages/count_tokens` | Basic estimate |
| Google Generate Content | `POST /v1beta/models/:model:generateContent` | Supported |
| OpenAI Images | `POST /v1/images/generations` | Not supported; returns 501 |
| Health | `GET /health` | No API key required |

Protocol compatibility does not guarantee identical behavior. Gemini Web model names, context limits, rate limits, errors, and safety policies can change; create your own contract tests before production integration.

## Configuration reference

| Variable | Default | Description |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | Listen address; use a reverse proxy and access control before public deployment |
| `PORT` | `8787` | Listen port |
| `API_KEY` | empty | Protect compatibility API routes when non-empty |
| `GEMINI_AUTH_MODE` | `auto` | `auto`/`browser` use the isolated auth profile; `env` enables compatibility Cookie mode |
| `GEMINI_COOKIES` | empty | JSON Cookie array; explicit compatibility mode only |
| `GEMINI_PROXY` | empty | HTTP/HTTPS proxy |
| `GEMINI_AUTH_PROFILE` | `default` | Local account identifier used to derive the isolated profile path |
| `GEMINI_AUTH_TIMEOUT_MS` | `120000` | Browser setup and recovery timeout |
| `GEMINI_BROWSER_CHANNEL` | `auto` | `auto`, `chrome`, or `msedge` |
| `GEMINI_BROWSER_EXECUTABLE_PATH` | empty | Local browser path override |
| `GEMINI_CHROME_USER_DATA_DIR` | empty | Chrome User Data root used only by `auth import-chrome`; auto-discovered when empty |
| `GEMINI_CHROME_PROFILE_NAME` | empty | Chrome profile directory used only by `auth import-chrome`; required when multiple profiles are detected, e.g. `Default` or `Profile 2` |
| `GEMINI_BROWSER_HEADLESS_RECOVERY` | `false` | Allow a headless recovery attempt before showing a window; Google sign-in may reject it |
| `GEMINI_AUTH_DATA_DIR` | empty | Auth profile root; keep it outside the repository |
| `GEMINI_COOKIE_REFRESH_SKEW_MS` | `300000` | Cookie refresh lead time |
| `GEMINI_SSE_HEARTBEAT_MS` | `2000` | SSE heartbeat interval |
| `GEMINI_STREAM_STALL_TIMEOUT_MS` | `120000` | Maximum execution time without upstream progress |
| `GEMINI_REPLAY_TTL_MS` | `900000` | Replay TTL for the same `x-request-id` |

Do not bind the service directly to the public Internet. Use HTTPS, a strong random API key, reverse-proxy access control, and request rate limits.

## Security

- Cookies are complete login credentials; revoke the session in Google account security if they leak.
- Never commit `.env`, auth state, cookies, proxy credentials, request bodies, or API keys.
- Do not expose the service directly to the Internet.
- Logs, errors, screenshots, and diagnostics must not contain cookie values or API keys.
- Normal startup does not read a user's daily browser profile. The explicit `auth import-chrome` command reads a temporary copy of the Chrome Cookie database only; it never fills passwords, verification codes, or passkeys.

## Development

```bash
npm install
npm run build
npm test
npm run test:watch
```

Main directories:

```text
src/auth/       Cookies, auth policies, and session management
src/accounts/   Accounts, leases, and account pool
src/gemini/     Gemini Web protocol, requests, and response parsing
src/transport/  Undici/fingerprint transport boundary
src/server/     Fastify app, routes, and SSE
tests/          Unit and API tests
docs/           Architecture and development documentation
```

Before submitting changes, run `npm run build` and `npm test`. Streaming, authentication, and credential changes should include failure, cancellation, and redaction tests.

## Contributing

Issues and pull requests are welcome. Include the Node.js version, operating system, redacted configuration summary, reproduction steps, and relevant logs; never upload cookies, API keys, account emails, request bodies, or browser profiles.

Before submitting a pull request, confirm:

1. Add corresponding tests or explain why testing is not possible.
2. Do not introduce credential leaks, arbitrary page automation, or external debug ports.
3. Do not make Chromium, Electron, or a user's browser profile a core runtime dependency.
4. Keep documented feature status aligned with the code.

## License

This repository has not declared an open-source license. Before public distribution, add a `LICENSE` file and state the license and copyright ownership; until then, do not assume the code may be freely copied, modified, or redistributed.

## Documentation

- [Developer documentation site](https://chucklery.github.io/gemini-web-bridge/)
- Local preview: `npm run docs:dev`
- Local build: `npm run docs:build`

- [Authentication lifecycle](docs/architecture/auth-lifecycle.md)
- [Quick start](docs/guide/quickstart.md)
- [Authentication guide](docs/guide/authentication.md)
- [Configuration reference](docs/reference/configuration.md)
- [Automatic Cookie authentication development plan](docs/automatic-gemini-cookie-auth-development-plan.md)
- [Architecture review and migration plan](docs/architecture-review-and-migration-plan.md)
