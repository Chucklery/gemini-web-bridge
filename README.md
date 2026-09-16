# Gemini Web Bridge

将 Gemini Web 会话封装为兼容 OpenAI、Anthropic 和 Google Generative Language API 的本地 HTTP 服务。

> [!WARNING]
> 本项目通过 Gemini Web 会话工作，不是 Google 官方 API，也不代表 Google。请遵守适用的 Google 服务条款、组织策略和所在地法律。登录 Cookie 等同于账号凭据，严禁提交到 Git、公开日志或第三方服务。

## 当前状态

项目处于早期开发阶段，适合本地实验和二次开发。当前已支持：

- Node.js 24+、TypeScript、Fastify。
- Gemini Web Cookie 会话和代理配置。
- OpenAI Chat Completions、Responses、Models 接口。
- Anthropic Messages、Count Tokens 接口。
- Google `generateContent` 兼容接口。
- 流式 SSE、心跳、客户端取消传播、确定终态和短 TTL 请求事件重放。
- 多账户池的基础抽象和按账户串行执行。
- 使用系统 Chrome/Edge 独立 Profile 的可选浏览器登录认证。

暂不支持：图像生成、官方 Gemini API Key 和完整多账户 CLI。图像接口会返回 `501 Not Implemented`。浏览器认证不下载 Chromium，也不会读取日常浏览器 Profile。

## 快速开始

### 环境要求

- Node.js 24 或更高版本
- 一个 Google 账号；浏览器模式会在项目专用窗口中完成登录

### 安装和配置

```bash
git clone <your-fork-url>
cd gemini-web-bridge
npm install
cp .env.example .env
```

编辑 `.env`。默认 `auto` 模式会使用项目专用的系统 Chrome/Edge Profile：

```dotenv
GEMINI_AUTH_MODE=auto
GEMINI_AUTH_PROFILE=default
GEMINI_BROWSER_CHANNEL=auto
```

首次启动或执行 `npm run auth -- login` 时，在可见窗口中完成登录。服务只在内存中保留经过 allowlist 校验的 Cookie 快照。找不到受支持浏览器时，显式切换到 `env` 兼容模式：

```dotenv
HOST=127.0.0.1
PORT=8787
API_KEY=change-this-local-key
GEMINI_AUTH_MODE=env
GEMINI_PROXY=
GEMINI_COOKIES='[{"name":"SID","value":"...","domain":".google.com","path":"/"},{"name":"SAPISID","value":"...","domain":".google.com","path":"/"},{"name":"APISID","value":"...","domain":".google.com","path":"/"}]'
```

Cookie 必须使用真实的 `domain`、`path`、`secure`、`httpOnly` 和过期信息；不要照抄示例中的占位值。服务不会把 Cookie 写入独立 JSON 文件，而是在进程内使用 Cookie Jar。

### 启动

```bash
npm run build
npm start
```

检查服务：

```bash
curl http://127.0.0.1:8787/health
curl -H 'Authorization: Bearer change-this-local-key' \
  http://127.0.0.1:8787/v1/models
```

也可以查看当前配置摘要，或生成 Codex 的 Responses Provider 配置：

```bash
npm run setup
npm run setup -- codex
npm run auth -- status
```

## API 使用

当 `API_KEY` 非空时，除 `/health` 外的接口需要发送：

```http
Authorization: Bearer <API_KEY>
```

### OpenAI Chat Completions

```bash
curl http://127.0.0.1:8787/v1/chat/completions \
  -H 'Authorization: Bearer change-this-local-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "gemini-2.0-flash",
    "messages": [{"role": "user", "content": "你好"}],
    "stream": true
  }'
```

### OpenAI Responses

```bash
curl http://127.0.0.1:8787/v1/responses \
  -H 'Authorization: Bearer change-this-local-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "gemini-2.0-flash",
    "input": "介绍一下这个项目",
    "stream": true
  }'
```

### 兼容接口

| 接口 | 路径 | 状态 |
| --- | --- | --- |
| OpenAI Models | `GET /v1/models` | 支持 |
| OpenAI Chat Completions | `POST /v1/chat/completions` | 支持，含 SSE |
| OpenAI Responses | `POST /v1/responses` | 支持，含 SSE |
| Anthropic Messages | `POST /v1/messages` | 支持 |
| Anthropic Count Tokens | `POST /v1/messages/count_tokens` | 基础估算 |
| Google Generate Content | `POST /v1beta/models/:model:generateContent` | 支持 |
| OpenAI Images | `POST /v1/images/generations` | 暂不支持，返回 501 |
| Health | `GET /health` | 不要求 API key |

协议兼容不等于行为完全一致。Gemini Web 的模型名、上下文能力、限流、错误和安全策略可能随 Google 服务变化；生产集成前请建立自己的契约测试。

## 配置参考

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | 监听地址；公开部署前请配置反向代理和访问控制 |
| `PORT` | `8787` | 监听端口 |
| `API_KEY` | 空 | 非空时保护兼容 API 接口 |
| `GEMINI_AUTH_MODE` | `auto` | `browser`/`auto` 使用独立系统浏览器 Profile；`env` 启用兼容 Cookie 模式 |
| `GEMINI_COOKIES` | 空 | Cookie JSON 数组；仅用于兼容模式 |
| `GEMINI_PROXY` | 空 | HTTP/HTTPS 代理地址 |
| `GEMINI_AUTH_PROFILE` | `default` | 本地随机化 Profile 目录的账户标识 |
| `GEMINI_AUTH_TIMEOUT_MS` | `120000` | 浏览器登录和恢复超时 |
| `GEMINI_BROWSER_CHANNEL` | `auto` | `auto`、`chrome` 或 `msedge` |
| `GEMINI_BROWSER_EXECUTABLE_PATH` | 空 | 自动探测失败时的本地浏览器路径 |
| `GEMINI_BROWSER_HEADLESS_RECOVERY` | `true` | 先尝试无头恢复，需交互时切换可见窗口 |
| `GEMINI_AUTH_DATA_DIR` | 空 | 浏览器 Profile 根目录；不应放入仓库 |
| `GEMINI_COOKIE_REFRESH_SKEW_MS` | `300000` | Cookie 刷新提前量配置 |
| `GEMINI_SSE_HEARTBEAT_MS` | `2000` | SSE 心跳配置 |
| `GEMINI_STREAM_STALL_TIMEOUT_MS` | `120000` | 上游无进展时的最大执行时间 |
| `GEMINI_REPLAY_TTL_MS` | `900000` | 同一 `x-request-id` 的事件重放 TTL |

如需对外监听，不建议直接将服务绑定到公网。至少应使用 HTTPS、强随机 API key、反向代理访问控制和合理的请求限流。

## 安全说明

- Cookie 是完整登录凭据，出现泄露时应立即在 Google 账号侧注销相关会话。
- 不要将 `.env`、Cookie、代理认证信息或请求正文提交到仓库。
- 不要把服务绑定到 `0.0.0.0` 后直接暴露互联网。
- 日志、错误报告、截图和诊断包不得包含 Cookie value 或 API key。
- 认证 Cookie 应使用原始作用域；不要为了“方便”把所有 Cookie 改成任意 domain。
- 项目不读取用户日常浏览器 Profile，也不自动填写 Google 账号、密码、验证码或 Passkey。

## 开发

```bash
npm install
npm run build
npm test
npm run test:watch
```

主要目录：

```text
src/auth/       Cookie、认证策略和会话管理
src/accounts/   账户、租约和账户池
src/gemini/     Gemini Web 协议、请求和响应解析
src/transport/  Undici/Fingerprint 传输边界
src/server/     Fastify 应用、路由和 SSE
tests/          单元测试与接口测试
docs/           架构和开发方案
```

提交修改前请运行 `npm run build` 和 `npm test`。涉及流式协议、认证或凭据处理的改动，应同时补充失败、取消和脱敏测试。

## 贡献

欢迎提交 Issue 和 Pull Request。建议在 Issue 中包含：Node.js 版本、操作系统、脱敏后的配置摘要、复现步骤和相关日志；不要上传 Cookie、API key、账号邮箱、请求正文或浏览器 Profile。

提交 PR 前请确认：

1. 改动有对应测试或说明为什么无法测试。
2. 不引入凭据泄露、任意页面自动化或外部调试端口。
3. 不把 Chromium、Electron 或用户浏览器 Profile 作为核心运行时依赖。
4. 文档中的功能状态与实际代码一致。

## 许可证

当前仓库尚未声明开源许可证。若要公开发布，请在根目录添加 `LICENSE`，并在本节明确许可证名称和版权归属；在此之前，不应默认将代码视为可自由复制、修改或分发。

## 相关文档

- [开发者文档站](https://chucklery.github.io/gemini-web-bridge/)
- 本地预览：`npm run docs:dev`
- 本地构建：`npm run docs:build`

- [自动 Gemini Cookie 认证与 Codex 断线治理开发方案](docs/automatic-gemini-cookie-auth-development-plan.md)
- [架构评审与迁移方案](docs/architecture-review-and-migration-plan.md)
