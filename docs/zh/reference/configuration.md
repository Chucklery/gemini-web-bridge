# 配置

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| HOST | 127.0.0.1 | 监听地址 |
| PORT | 8787 | 监听端口 |
| API_KEY | 空 | 非空时保护兼容 API |
| GEMINI_AUTH_MODE | auto | auto/browser 使用专用认证 Profile；env 使用 Cookie 兼容模式 |
| GEMINI_COOKIES | 空 | 显式 env 模式使用的 JSON Cookie 数组 |
| GEMINI_AUTH_PROFILE | default | 用于生成专用 Profile 路径的账号标识 |
| GEMINI_AUTH_TIMEOUT_MS | 120000 | 浏览器配置/恢复超时 |
| GEMINI_BROWSER_CHANNEL | auto | auto、chrome 或 msedge |
| GEMINI_BROWSER_EXECUTABLE_PATH | 空 | 浏览器路径覆盖 |
| GEMINI_BROWSER_HEADLESS_RECOVERY | true | 先尝试无头恢复 |
| GEMINI_AUTH_DATA_DIR | 空 | 专用 Profile 与认证状态根目录 |
| GEMINI_PROXY | 空 | HTTP/HTTPS 代理 |
| GEMINI_SSE_HEARTBEAT_MS | 2000 | SSE 心跳间隔 |
| GEMINI_STREAM_STALL_TIMEOUT_MS | 120000 | 上游无进展的最长时间 |
| GEMINI_REPLAY_TTL_MS | 900000 | 事件重放 TTL |

默认认证状态路径：

```text
~/.gemini-web-bridge/browser-profiles/<hashed-account-id>/gemini-auth-state.json
```

请将该目录放在仓库之外，并按凭据存储进行保护。
