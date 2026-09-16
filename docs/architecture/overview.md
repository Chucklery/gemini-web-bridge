# 架构总览

当前实现的主链路：

```text
HTTP route → API adapter → AccountPool → Account → GeminiClient
                                           ↓
                              Transport + Gemini RPC/stream parser
```

## 分层职责

| 层 | 目录 | 职责 |
| --- | --- | --- |
| 接入层 | `src/server/` | Fastify 生命周期、鉴权、路由、SSE 输出 |
| 适配层 | `src/adapters/` | 将 OpenAI/Anthropic/Google 请求转换为内部 prompt |
| 调度层 | `src/accounts/` | 账户选择、串行 lease、失败冷却、重试 |
| Provider | `src/gemini/` | bootstrap、模型目录、请求构造、RPC 和流解析 |
| 传输层 | `src/transport/` | Cookie、代理、HTTP 请求和流式读取 |
| 认证层 | `src/auth/`、`src/browser-auth/` | Cookie 来源、浏览器 Profile、刷新和脱敏 |

## 一次请求如何运行

1. Fastify 先执行 API key hook；`/health` 例外。
2. 路由解析外部协议，请求进入对应 adapter。
3. `AccountPool` 选择健康账户并通过 lease 保证账户内串行。
4. `GeminiClient` 必要时 bootstrap，构造 Gemini Web RPC 请求。
5. stream parser 把上游记录变成 text/session/done 等事件。
6. 路由把事件编码回 OpenAI、Anthropic 或 Google 响应。

当前系统是“Gemini Web 原型 + 多协议 HTTP 外壳”；这一区别很重要：OpenAI adapter 不是 ChatGPT Web 客户端。
