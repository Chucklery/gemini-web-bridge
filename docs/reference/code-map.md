# 代码地图

```text
src/auth/          Cookie、认证策略、会话管理和脱敏
src/browser-auth/  系统浏览器发现、Profile 和登录流程
src/accounts/      账户、租约、balancer 和账户池
src/gemini/        Gemini Web bootstrap、RPC、请求/响应解析
src/transport/     Undici、代理和浏览器传输边界
src/server/        Fastify app、路由、中间件和 SSE
src/adapters/      外部兼容协议到当前 Gemini prompt 的转换
src/core/          通用生成契约（持续演进中）
tests/             单元测试和接口测试
docs/              本开发者文档与架构方案
```

改动认证、流式协议或凭据处理时，应同时更新对应流程文档和失败/取消/脱敏测试。
