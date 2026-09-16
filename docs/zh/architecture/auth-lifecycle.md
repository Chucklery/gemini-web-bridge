# 认证与 Cookie 生命周期

## 运行时边界

浏览器拥有持久登录会话；服务只拥有经过校验的本地认证状态快照：

```text
浏览器配置/恢复 → CookiePolicy → gemini-auth-state.json
                                      ↓
                         FileCookieSource → CookieJar → HTTP transport
```

登录成功后，状态保存于账号专用 Profile 目录。正常启动时首先读取状态文件，不启动浏览器；GeminiClient 随后通过 HTTP 完成 bootstrap、模型发现和生成。

## 状态转换

- **未配置**：没有状态文件，执行 `login`。
- **可用**：状态存在且 Cookie 未接近过期，直接服务请求。
- **需刷新**：状态缺失、过期或上游返回认证失败，执行显式 `refresh` 或 `login`。
- **已退出**：`logout` 删除项目专用认证边界。

恢复成功后，新的状态文件通过临时文件写入并 rename 原子替换；内存 CookieJar 只有在新会话校验成功后才切换。SessionManager 提供 single-flight，多个并发请求不会各自启动一次恢复。

## 权限与泄露防护

状态文件为 `gemini-auth-state.json`，目录权限为 0700，文件权限为 0600。它等同于登录凭据，不得提交、记录、复制或上传。Cookie 值不得出现在日志、异常、测试快照、诊断截图或健康检查响应中。

不读取日常浏览器 Profile、不连接已有浏览器、不开放外部 CDP 端口，可以避免凭据扩大暴露、Profile 锁冲突和浏览器版本耦合，并明确 logout 的责任边界。
