# HTTP endpoints

| Method | Path | Status |
| --- | --- | --- |
| GET | /health | Supported; no API key required |
| GET | /v1/models | Supported |
| POST | /v1/chat/completions | Supported, including SSE |
| POST | /v1/responses | Supported, including SSE |
| POST | /v1/messages | Supported |
| POST | /v1/messages/count_tokens | Basic estimate |
| POST | /v1beta/models/:model:generateContent | Supported |
| POST | /v1/images/generations | Not supported; returns 501 |

The /health response contains only account-pool counts, states, failure counts, and time metadata. It must not contain cookies or API keys.
