# 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | 监听地址 |
| `PORT` | `8787` | 监听端口 |
| `API_KEY` | 空 | 非空时保护兼容 API |
| `GEMINI_AUTH_MODE` | `auto` | `auto`、`browser` 或 `env` |
| `GEMINI_COOKIES` | 空 | env 模式下的 Cookie JSON |
| `GEMINI_AUTH_PROFILE` | `default` | 项目 Profile 标识 |
| `GEMINI_AUTH_TIMEOUT_MS` | `120000` | 登录/恢复超时 |
| `GEMINI_BROWSER_CHANNEL` | `auto` | `auto`、`chrome` 或 `msedge` |
| `GEMINI_BROWSER_EXECUTABLE_PATH` | 空 | 浏览器路径高级配置 |
| `GEMINI_BROWSER_HEADLESS_RECOVERY` | `true` | 是否先尝试无头恢复 |
| `GEMINI_AUTH_DATA_DIR` | 空 | Profile 根目录，不应在仓库内 |
| `GEMINI_PROXY` | 空 | HTTP/HTTPS 代理 |
| `GEMINI_SSE_HEARTBEAT_MS` | `2000` | SSE 心跳间隔 |
| `GEMINI_STREAM_STALL_TIMEOUT_MS` | `120000` | 上游无进展最大时长 |
| `GEMINI_REPLAY_TTL_MS` | `900000` | 请求事件重放 TTL |

完整配置校验见 [`src/config/env.ts`](https://github.com/Chucklery/gemini-web-bridge/blob/main/src/config/env.ts)。
