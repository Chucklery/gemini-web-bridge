# Guides

Gemini Web Bridge runs on Node.js 24+ and sends Gemini Web requests through the Undici HTTP transport.

Recommended reading order:

1. [Quick start](./quickstart)
2. [Authentication](./authentication)
3. [API usage](./api-usage)
4. [Troubleshooting](./troubleshooting)

The browser is a setup and recovery tool, not a runtime dependency. After login, the service uses the saved auth state and does not launch a browser during normal requests.
