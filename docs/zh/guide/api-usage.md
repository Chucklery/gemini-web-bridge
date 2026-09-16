# API 使用

## 通用约定

服务默认监听 `http://127.0.0.1:8787`。当 `API_KEY` 非空时，除 `GET /health` 外必须携带：

```http
Authorization: Bearer <API_KEY>
```

请求体按各兼容协议的有限子集校验；字段被接受不代表 Gemini Web 一定支持同等语义。建议先用 `GET /v1/models` 确认可用模型。

## OpenAI Chat Completions

非流式请求：

```bash
curl http://127.0.0.1:8787/v1/chat/completions \
  -H 'Authorization: Bearer change-this-local-key' \
  -H 'Content-Type: application/json' \
  -d '{"model":"gemini-2.0-flash","messages":[{"role":"user","content":"你好"}]}'
```

设置 `"stream":true` 后返回 `text/event-stream`。文本以 `chat.completion.chunk` 增量输出，并以 `data: [DONE]` 结束；服务也可能发送 `response.heartbeat` 心跳。客户端必须忽略未知事件或非内容增量。

当前适配器将 messages 的 role 与 content 线性转换为 prompt，复杂的 OpenAI 工具调用、音频、图像输入和高级采样语义不应视为已支持。

## OpenAI Responses

```bash
curl http://127.0.0.1:8787/v1/responses \
  -H 'Authorization: Bearer change-this-local-key' \
  -H 'Content-Type: application/json' \
  -d '{"model":"gemini-2.0-flash","input":"介绍一下这个项目","stream":true}'
```

Responses 流会发送 `response.created`、输出项/内容片段事件、文本 delta，以及 completed 或 failed 终态。带相同 `x-request-id` 的并发请求可读取短 TTL replay journal 中已记录事件；重放不会再次提交 Gemini 请求。

## Anthropic 与 Google

- `POST /v1/messages`：Anthropic Messages，当前为非流式基础适配。
- `POST /v1/messages/count_tokens`：基础 token 估算，不等同于 Gemini 实际计费或上下文统计。
- `POST /v1beta/models/:model:generateContent`：Google Generate Content，当前为非流式基础适配。
- `POST /v1/images/generations`：当前返回 `501`，不提供图像生成。

## 错误与重试

响应头发送后，流式失败通过终态 SSE 事件表达，不能再改写为 JSON HTTP 错误。客户端取消会向上游传播 AbortSignal。只有在尚未向下游发送内容且确认上游未接受请求时才适合重试；收到 session 或 text 事件后不得自动切换账号。
