# 配置参考

配置从项目根目录的 `.env` 及进程环境变量读取。环境变量值会经过类型校验；端口、超时和 TTL 必须为正数，认证模式和浏览器通道只能使用允许值。进程环境变量优先于 `.env`。

## 服务与认证

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | 监听地址。生产部署建议仍监听内网地址，由反向代理对外提供 HTTPS。 |
| `PORT` | `8787` | 监听端口。 |
| `API_KEY` | 空 | 非空时保护除 `/health` 外的兼容 API。 |
| `GEMINI_AUTH_MODE` | `auto` | `auto`/`browser` 使用隔离认证 Profile；`env` 使用 Cookie 兼容模式。 |
| `GEMINI_AUTH_PROFILE` | `default` | 账号标识，用于派生隔离 Profile 路径；不应填写密码。 |
| `GEMINI_AUTH_DATA_DIR` | 空 | 认证数据根目录。为空时使用用户目录下的默认路径。 |
| `GEMINI_AUTH_TIMEOUT_MS` | `120000` | 浏览器登录/恢复的超时时间。 |
| `GEMINI_COOKIES` | 空 | JSON Cookie 数组，仅在显式 `env` 模式使用。 |
| `GEMINI_COOKIE_REFRESH_SKEW_MS` | `300000` | 在 Cookie 到期前提前刷新的时间窗口。 |

## 浏览器

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `GEMINI_BROWSER_CHANNEL` | `auto` | 浏览器通道：`auto`、`chrome` 或 `msedge`。 |
| `GEMINI_BROWSER_EXECUTABLE_PATH` | 空 | 覆盖浏览器可执行文件路径。 |
| `GEMINI_CHROME_USER_DATA_DIR` | 空 | `import-chrome` 使用的 Chrome User Data 根目录；为空时按操作系统自动发现。 |
| `GEMINI_CHROME_PROFILE_NAME` | 空 | `import-chrome` 使用的 Profile 目录名，例如 `Default` 或 `Profile 2`；检测到多个 Profile 时必须填写。 |
| `GEMINI_BROWSER_HEADLESS_RECOVERY` | `false` | 是否先尝试无头恢复。Google 可能拒绝自动化/无头登录，默认使用可见窗口。 |

## 上游、流式与重放

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `GEMINI_TIMEOUT_MS` | `600000` | Gemini 上游请求总体超时。 |
| `GEMINI_PROXY` | 空 | HTTP/HTTPS 代理。 |
| `GEMINI_SSE_HEARTBEAT_MS` | `2000` | 下游 SSE 心跳间隔，只维持连接，不代表上游有进展。 |
| `GEMINI_STREAM_STALL_TIMEOUT_MS` | `120000` | 上游无任何进展时的最大等待时间。 |
| `GEMINI_REPLAY_TTL_MS` | `900000` | 相同 `x-request-id` 的 Responses 事件重放 TTL。 |

默认认证状态路径：

```text
~/.gemini-web-bridge/browser-profiles/<hashed-account-id>/gemini-auth-state.json
```

## 安全建议

认证数据目录必须放在仓库之外。目录使用 owner-only 权限（0700），状态文件使用 0600，并通过临时文件加 rename 的方式更新。不要在环境变量、命令行参数、日志或诊断输出中暴露 Cookie；环境变量模式尤其要注意 shell 历史与进程可见性。

不要将 `HOST` 设为 `0.0.0.0` 后直接暴露公网。至少配置 HTTPS、强随机 `API_KEY`、反向代理访问控制、限流和日志脱敏。
