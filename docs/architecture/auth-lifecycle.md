# 认证与 Cookie 生命周期

认证的核心是让浏览器拥有持久化登录态，让服务只拥有短生命周期的、经过 allowlist 校验的 Cookie 快照：

```text
Profile → browserContext.cookies(url) → CookiePolicy → SessionManager
                                                   ↓
                                      原子替换 GeminiCookies/Client
```

启动时由 `CookieSource.current()` 取得快照；认证失效、临近过期或手动刷新时由 `refresh(reason)` 生成新快照。刷新成功并通过 bootstrap 验证后才替换当前客户端，避免把正在执行的请求切换到半更新状态。

`SessionManager` 负责 single-flight：并发请求只触发一次刷新。账户状态按 `ready`、`refreshing`、`auth_required` 等阶段变化；认证失败不会悄悄降级到匿名请求。

## 为什么不读取日常浏览器

读取 Cookie 数据库、接管现有浏览器或开放 CDP 端口会扩大凭据暴露面并制造跨平台锁/版本问题。项目专用 Profile 可明确登录态所有权、账号隔离和登出边界。
