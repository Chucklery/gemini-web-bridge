# 架构总览

## 设计目标

项目的核心目标是把“外部兼容协议”和“Gemini Web 私有协议”隔离开，同时把浏览器登录从在线请求路径中移除。这样可以让协议适配、账号调度、认证生命周期和上游传输分别演进，并在发生上游协议变化时控制影响范围。

## 主请求链路

```text
HTTP route → API adapter → AccountPool → Account → GeminiClient
                                           ↓
                              Transport + Gemini RPC/stream parser
```

## 分层职责

| 层 | 目录 | 职责 |
| --- | --- | --- |
| 接入层 | `src/server/` | Fastify 生命周期、API Key 鉴权、路由注册和 SSE 输出 |
| 适配层 | `src/adapters/` | OpenAI/Anthropic/Google 请求到内部 prompt、事件和错误的映射 |
| 调度层 | `src/accounts/` | 健康账号选择、单账号串行租约、冷却、失败记录和重试 |
| Provider 层 | `src/gemini/` | bootstrap、模型目录、请求构造、私有 RPC 和流解析 |
| 传输层 | `src/transport/` | CookieJar、代理、HTTP 请求、响应流和取消传播 |
| 认证层 | `src/auth/`、`src/browser-auth/` | Cookie 来源、隔离 Profile、状态校验、恢复和脱敏 |
| 核心契约 | `src/core/` | Provider 无关的生成调用、事件与错误类型 |

## 请求生命周期

1. Fastify 中间件校验 API Key，`/health` 例外放行。
2. Route 校验外部请求并调用对应 Adapter。
3. AccountPool 选择健康账号，为账号申请串行租约。
4. GeminiClient 必要时执行 bootstrap，构造 Gemini Web RPC 请求。
5. Provider 将上游记录解析为内部 text、session、done 等事件。
6. Adapter/Route 将内部事件编码为目标兼容响应。
7. 客户端断开、上游错误或 stall 时，AbortSignal 沿调用链向上传播并释放租约。

## 关键原则

- Route 不直接拼接 Gemini RPC，也不接触 Cookie。
- Provider 不负责 OpenAI 或 Anthropic 的响应 schema。
- 已经向下游发送内容后，不自动切换账号或重复提交。
- 浏览器只属于认证恢复边界；正常请求只走 Node HTTP transport。

这是“Gemini Web Provider + 多协议 HTTP 外壳”，不是 ChatGPT Web 客户端，也不是官方 Gemini API 代理。
