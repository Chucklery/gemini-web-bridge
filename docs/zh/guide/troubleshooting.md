# 故障排查

## 先收集安全信息

先执行 `npm run auth -- status` 和 `curl /health`，记录 Node.js 版本、操作系统、脱敏后的配置摘要和复现步骤。不要上传 Cookie、API Key、账号邮箱、Profile、截图或请求体。

## 常见问题

### 找不到浏览器

确认已安装 Chrome 或 Edge。必要时设置 `GEMINI_BROWSER_CHANNEL=chrome` 或 `msedge`，也可以用 `GEMINI_BROWSER_EXECUTABLE_PATH` 指定可执行文件。不要关闭浏览器安全特性绕过登录拦截；无浏览器机器可明确使用 `GEMINI_AUTH_MODE=env` 救援。

### auth_required 或 bootstrap 失败

依次执行：

```bash
npm run auth -- status
npm run auth -- refresh
```

若 Google 要求交互验证，使用 `npm run auth -- login` 并在可见窗口完成。仍失败时检查系统时间、代理连通性、浏览器版本以及状态文件权限。

### /v1/models 失败

先确认服务已构建并启动，再确认 API Key、Cookie 状态和模型请求路径。认证状态有效但 bootstrap 失败，通常应先刷新会话，再检查代理是否能访问 Gemini Web。

### SSE 断流或客户端重复接收

反向代理必须关闭响应 buffering，并将 read timeout 设置为高于 `GEMINI_STREAM_STALL_TIMEOUT_MS`。心跳只能维持下游连接，不能替代上游 stall timeout。Responses 客户端应稳定传递 `x-request-id`，以便在短暂重连时利用同一执行的事件重放。

### 返回 501

确认请求是否为 `/v1/images/generations`；该能力当前明确未实现，并非认证问题。
