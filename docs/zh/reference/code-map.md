# 代码地图

## 目录职责

```text
src/auth/          Cookie 来源、策略、会话管理与脱敏
src/browser-auth/  系统浏览器发现、隔离 Profile 与登录流程
src/accounts/      账号、租约、balancer、账户池与冷却
src/gemini/        Gemini Web bootstrap、模型、RPC、请求/响应解析
src/transport/     Undici HTTP、代理、Cookie 与流式读取边界
src/server/        Fastify 应用、鉴权、路由、中间件与 SSE 编码
src/adapters/      OpenAI/Anthropic/Google 请求到内部 prompt 的映射
src/core/          Provider 无关的生成契约、事件与错误
tests/             认证、传输、解析、路由、重试与账户池测试
docs/              用户指南、参考文档与架构决策
```

## 请求依赖方向

```text
route → adapter/shared → AccountPool → Account → GeminiClient
                                                      ↓
                                      Transport + RPC/stream parser
```

Route 负责协议入口和生命周期；Adapter 负责外部 schema 到内部请求的转换；AccountPool 负责选择、租约、串行化和重试；Provider 负责 Gemini Web 私有协议；Transport 负责 HTTP、Cookie、代理和取消传播。凭据不应穿透到 route 或 adapter。

## 变更定位

- 新增兼容接口：先看 `src/server/routes` 和 `src/adapters`。
- 修改模型发现、请求构造或 RPC：看 `src/gemini`。
- 修改认证、刷新或脱敏：看 `src/auth` 与 `src/browser-auth`。
- 修改代理、超时或流读取：看 `src/transport`。
- 修改流式终态、重放或心跳：看 `src/server/streaming`。

认证、流式协议或凭据处理的变更必须同步更新文档，并补充失败、取消、重试边界及脱敏断言。
