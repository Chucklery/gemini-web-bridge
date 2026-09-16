# API 使用

当 API_KEY 非空时，除 /health 外的接口需要：

```http
Authorization: Bearer <API_KEY>
```

OpenAI base URL 为 http://127.0.0.1:8787/v1；Google 使用 /v1beta。支持 OpenAI、Anthropic 和 Google 兼容接口。
