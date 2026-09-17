# 贡献指南

## 开始前

```bash
npm install
npm run build
npm test
npm run docs:build
```

## 分层约束

保持 route、adapter、provider、transport、account 和认证层边界清晰：

- Route 只负责协议入口、鉴权、响应生命周期和 SSE 编码；
- Adapter 负责外部协议到内部请求/事件的映射；
- Provider 负责 Gemini Web bootstrap、RPC 和解析；
- Transport 负责 HTTP、代理、CookieJar、流读取和取消；
- AccountPool 负责账号选择、串行租约、冷却和安全重试；
- 认证层负责状态来源、校验、刷新、持久化和脱敏。

不要在日志、错误、测试快照或诊断输出中泄露 Cookie、API Key、代理凭据、账号邮箱或请求体。

## 测试要求

为成功、失败、取消、超时和重试路径补充测试。涉及流式协议时，至少覆盖正常终态、上游 stall、客户端断开、headers 已发送后的错误和事件重放；涉及凭据时增加脱敏断言。修改协议或配置时同步更新中文和英文文档。

## 提交检查清单

- 不提交 `.env`、Cookie、认证状态文件、API Key、浏览器 Profile 或诊断截图；
- 默认运行路径不读取用户日常浏览器 Profile，不连接已有浏览器或开放外部 CDP 端口；显式 `import-chrome` 只能读取临时 Cookie 数据库副本；
- 不自动填写密码、验证码或 Passkey；
- 不将 Chromium、Electron 或用户浏览器变成服务运行时依赖；
- 运行 `npm run build`、`npm test` 和 `npm run docs:build`；
- 在 PR 中提供 Node.js 版本、操作系统、脱敏配置摘要和复现步骤。

本仓库尚未声明开源许可证；在许可证明确前，不要假设代码可以自由再分发。
