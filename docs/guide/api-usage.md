# 调用兼容 API

当 `API_KEY` 非空时，除 `/health` 外的接口均要求：

```http
Authorization: Bearer <API_KEY>
```

## OpenAI Chat Completions

```bash
curl http://127.0.0.1:8787/v1/chat/completions \
  -H 'Authorization: Bearer change-this-local-key' \
  -H 'Content-Type: application/json' \
  -d '{"model":"gemini-2.0-flash","messages":[{"role":"user","content":"你好"}],"stream":true}'
```

## OpenAI Responses

```bash
curl http://127.0.0.1:8787/v1/responses \
  -H 'Authorization: Bearer change-this-local-key' \
  -H 'Content-Type: application/json' \
  -d '{"model":"gemini-2.0-flash","input":"介绍一下这个项目","stream":true}'
```

## Google 与 Anthropic

- `POST /v1/messages`：Anthropic Messages。
- `POST /v1/messages/count_tokens`：基础 token 估算。
- `POST /v1beta/models/:model:generateContent`：Google Generate Content。

协议兼容不代表行为完全一致。模型目录、上下文、限流、错误和安全策略由 Gemini Web 决定；正式集成前请写自己的契约测试。
