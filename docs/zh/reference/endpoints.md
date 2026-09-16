# HTTP 端点参考

默认地址为 `http://127.0.0.1:8787`。除 `GET /health` 外，只有在 `API_KEY` 非空时才强制校验 Bearer Token。

| 方法 | 路径 | 状态 | 说明 |
| --- | --- | --- | --- |
| GET | `/health` | 支持 | 返回账户池计数、状态、失败次数和时间元数据；不返回凭据。 |
| GET | `/v1/models` | 支持 | 获取 Provider 可发现的模型目录。 |
| POST | `/v1/chat/completions` | 支持 | OpenAI Chat Completions；`stream=true` 返回 SSE。 |
| POST | `/v1/responses` | 支持 | OpenAI Responses；支持 SSE 与按 `x-request-id` 的短 TTL 事件重放。 |
| POST | `/v1/messages` | 支持 | Anthropic Messages，当前为基础非流式适配。 |
| POST | `/v1/messages/count_tokens` | 基础支持 | 返回估算值，不等同于 Gemini 实际 token 计数。 |
| POST | `/v1beta/models/:model:generateContent` | 支持 | Google Generate Content，当前为基础非流式适配。 |
| POST | `/v1/images/generations` | 不支持 | 返回 HTTP 501。 |

## 认证头

```http
Authorization: Bearer <API_KEY>
Content-Type: application/json
```

`API_KEY` 为空时，开发环境可以省略 Authorization；不建议在共享网络或生产环境这样配置。

## 流式约束

SSE 响应使用 `text/event-stream`，并关闭代理 buffering。Chat Completions 以文本 chunk 输出并以 `[DONE]` 结束；Responses 以事件类型区分 created、delta、completed 和 failed。客户端断开会取消上游执行；headers 已发送后，失败不能再转换为普通 JSON 错误。
