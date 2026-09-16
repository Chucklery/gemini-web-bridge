# Gemini Web Bridge（中文）

将 Gemini Web 会话封装为兼容 OpenAI、Anthropic 和 Google API 的本地 HTTP 服务。

英文主文档请看 [README.md](README.md)。

## 认证运行方式

首次执行 `npm run auth -- login` 时，项目会打开独立的 Chrome/Edge 窗口完成登录，并将经过校验的认证状态保存到私有 Profile 目录中的 `gemini-auth-state.json`。

完成配置后，服务启动和日常请求只读取该认证状态并通过 HTTP 调用 Gemini Web，不启动浏览器，也不运行 Gemini 前端脚本。

只有以下情况需要浏览器：

- 首次账号配置；
- 执行 `npm run auth -- refresh`；
- Cookie 或登录状态失效后的认证恢复。

快速开始、API、配置、安全和开发说明请从 [英文 README](README.md) 进入。中文认证说明见 [认证流程](docs/guide/authentication.md)。
