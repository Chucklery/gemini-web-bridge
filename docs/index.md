---
layout: home
---

<div class="hero-panel">
  <p class="hero-kicker">Developer documentation · v0.1</p>
  <h1>Gemini Web Bridge</h1>
  <p class="hero-lead">A local, auditable HTTP service that projects a Gemini Web session into OpenAI, Anthropic, and Google-compatible APIs.</p>
  <div class="hero-actions">
    <a href="/gemini-web-bridge/guide/quickstart">Quick start</a>
    <a href="/gemini-web-bridge/architecture/overview">Architecture</a>
    <a href="https://github.com/Chucklery/gemini-web-bridge">Source ↗</a>
  </div>
</div>

## Start here

| Goal | Guide |
| --- | --- |
| Run the service for the first time | [Quick start](./guide/quickstart) |
| Configure or recover authentication | [Authentication](./guide/authentication) |
| Call a compatible API | [API usage](./guide/api-usage) |
| Understand the request path | [Architecture overview](./architecture/overview) |
| Diagnose auth or streaming failures | [Troubleshooting](./guide/troubleshooting) |
| Read the Chinese entry point | [简体中文 README](https://github.com/Chucklery/gemini-web-bridge/blob/main/README.zh-CN.md) |

## Runtime model

The browser is required only for initial setup or explicit authentication recovery. Once configured, the service reads the account's local auth-state file and uses the Node HTTP transport for bootstrap, model discovery, generation, and streaming. Normal startup does not launch a browser or execute Gemini frontend scripts.

## Design principles

1. **Minimize credential exposure:** use an isolated project-owned profile and owner-only auth state.
2. **Keep protocol boundaries clear:** separate inbound compatibility APIs, internal generation semantics, and Gemini Web RPC.
3. **Make failure explicit:** distinguish authentication, rate limits, upstream failures, cancellation, and unsupported capabilities.
4. **Give streams a definite end state:** cancellation, timeout, and network failures must be observable.

> This is not Google's official API. Gemini Web behavior, models, limits, and private RPC fields can change without notice.
