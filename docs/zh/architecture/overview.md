# 架构总览

主请求链路：

~~~~text
HTTP route → API adapter → AccountPool → Account → GeminiClient
                                           ↓
                              Transport + Gemini RPC/stream parser
~~~~

## 分层职责

| 层 | 目录 | 职责 |
| --- | --- | --- |
| 接入层 | src/server/ | Fastify 生命周期、鉴权、路由和 SSE 输出 |
| 适配层 | src/adapters/ | 将 OpenAI/Anthropic/Google 请求映射为内部 prompt |
| 调度层 | src/accounts/ | 账户选择、串行租约、冷却和重试 |
| Provider | src/gemini/ | Bootstrap、模型目录、请求构造、RPC 和流解析 |
| 传输层 | src/transport/ | Cookie、代理、HTTP 请求和流式读取 |
| 认证层 | src/auth/、src/browser-auth/ | 认证来源、专用 Profile、恢复和脱敏 |

## 请求生命周期

1. Fastify 检查 API key，/health 例外。
2. 路由解析外部协议并调用对应 adapter。
3. AccountPool 选择健康账户，并保证账户内串行。
4. GeminiClient 按需 bootstrap 并构造 Gemini Web RPC 请求。
5. 流解析器将上游记录转换为 text、session 和 done 事件。
6. 路由将事件编码为目标兼容协议响应。

这是 Gemini Web 客户端加多协议 HTTP 外壳，不是 ChatGPT Web 客户端。
