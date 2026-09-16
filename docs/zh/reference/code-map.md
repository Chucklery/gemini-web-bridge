# 代码地图

~~~~text
src/auth/          Cookie、认证策略、会话和脱敏
src/browser-auth/  系统浏览器发现、Profile 和登录流程
src/accounts/      账户、租约、balancer 和账户池
src/gemini/        Gemini Web bootstrap、RPC、请求和响应解析
src/transport/     Undici、代理和浏览器指纹传输
src/server/        Fastify 应用、路由、中间件和 SSE
src/adapters/      兼容协议到 Gemini prompt 的映射
src/core/          通用生成契约
tests/             单元测试和 API 测试
docs/              开发者与架构文档
~~~~

修改认证、流式协议或凭据处理时，应同步更新对应指南，并增加失败、取消和脱敏测试。
