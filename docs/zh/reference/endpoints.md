# HTTP 端点

| 方法 | 路径 | 状态 |
| --- | --- | --- |
| GET | /health | 支持；不要求 API key |
| GET | /v1/models | 支持 |
| POST | /v1/chat/completions | 支持，含 SSE |
| POST | /v1/responses | 支持，含 SSE |
| POST | /v1/messages | 支持 |
| POST | /v1/messages/count_tokens | 基础估算 |
| POST | /v1beta/models/:model:generateContent | 支持 |
| POST | /v1/images/generations | 暂不支持；返回 501 |

/health 只返回账户池数量、状态、失败次数和时间元数据，不应包含 Cookie 或 API key。
