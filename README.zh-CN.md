# Gemini Web Bridge

将 Gemini Web 会话封装为本地 HTTP 服务，并提供 OpenAI、Anthropic 与 Google Generative Language API 的兼容入口。

> **重要提示**：本项目使用 Gemini Web 的私有会话，不使用官方 Gemini API Key，也不代表 Google。请遵守 Google 服务条款、组织安全政策及适用法律。Cookie 与认证状态文件等同于完整登录凭据，严禁提交到代码仓库或向他人披露。

## 项目定位与当前边界

这是一个面向本地实验、开发和内部集成的协议适配层：下游客户端使用熟悉的兼容协议，上游由 Provider 层通过 HTTP 调用 Gemini Web。兼容的是请求和响应的主要形状，不承诺与官方 API 或原生客户端完全一致。

当前支持：

- Node.js 24+、TypeScript 与 Fastify；
- Gemini Web Cookie 会话和 HTTP/HTTPS 代理；
- OpenAI Chat Completions、Responses、Models；
- Anthropic Messages、Count Tokens（基础估算）；
- Google `generateContent`；
- SSE 流式输出、心跳、客户端取消、终态事件和短 TTL 事件重放；
- 基础多账号池抽象及单账号串行执行；
- 使用隔离的 Chrome/Edge Profile 进行登录和认证恢复。

明确不支持：图像生成、官方 Gemini API Key、完整的多账号 CLI。图像端点会返回 `501 Not Implemented`。浏览器认证不会下载 Chromium，不会读取日常浏览器 Profile，也不会在运行时执行 Gemini 前端脚本。

## 快速开始

### 前置条件

- Node.js 24 或更高版本；
- Google 账号；
- 本机安装 Chrome 或 Microsoft Edge。项目不会自动下载浏览器。

### 安装

```bash
git clone <your-fork-url>
cd gemini-web-bridge
npm install
cp .env.example .env
```

默认 `auto` 模式使用项目专用的浏览器认证 Profile：

```dotenv
GEMINI_AUTH_MODE=auto
GEMINI_AUTH_PROFILE=default
GEMINI_BROWSER_CHANNEL=auto
HOST=127.0.0.1
PORT=8787
API_KEY=change-this-local-key
```

首次登录：

```bash
npm run auth -- login
```

命令会打开隔离的 Chrome/Edge 窗口，由用户自行完成 Google 登录。校验后的 Cookie 快照默认保存到 `~/.gemini-web-bridge/browser-profiles/<hashed-account-id>/gemini-auth-state.json`。之后启动服务无需浏览器：

```bash
npm run build
npm start
```

### 健康检查

```bash
curl http://127.0.0.1:8787/health
curl -H 'Authorization: Bearer change-this-local-key' \
  http://127.0.0.1:8787/v1/models
```

也可以查看认证状态或生成 Codex Responses Provider 配置：

```bash
npm run auth -- status
npm run setup
npm run setup -- codex
```

## 认证模式

`auto`（默认）和 `browser` 使用项目专用浏览器 Profile；首次登录、显式 `refresh` 或认证失效恢复时才打开浏览器。`env` 是无浏览器环境下的兼容救援模式，要求通过 `GEMINI_COOKIES` 传入真实 Cookie，凭据只保留在进程中。

```bash
npm run auth -- login
npm run auth -- status
npm run auth -- refresh
npm run auth -- logout
```

Google 要求交互验证时，应执行 `login` 并在可见窗口中完成验证。项目不会填写密码、验证码或 Passkey，也不会接管用户日常浏览器 Profile。认证状态缺失或失效时，服务会失败关闭，不会降级为匿名请求。

## API 概览

当 `API_KEY` 非空时，除 `/health` 外的所有端点都必须携带 `Authorization: Bearer <API_KEY>`。

| 接口 | 路径 | 能力 |
| --- | --- | --- |
| OpenAI Models | `GET /v1/models` | 支持 |
| OpenAI Chat Completions | `POST /v1/chat/completions` | 支持，含 SSE |
| OpenAI Responses | `POST /v1/responses` | 支持，含 SSE 与同请求重放 |
| Anthropic Messages | `POST /v1/messages` | 支持非流式 |
| Anthropic Count Tokens | `POST /v1/messages/count_tokens` | 基础估算 |
| Google Generate Content | `POST /v1beta/models/:model:generateContent` | 支持非流式 |
| OpenAI Images | `POST /v1/images/generations` | 不支持，返回 501 |
| Health | `GET /health` | 无需 API Key |

示例：

```bash
curl http://127.0.0.1:8787/v1/chat/completions \
  -H 'Authorization: Bearer change-this-local-key' \
  -H 'Content-Type: application/json' \
  -d '{"model":"gemini-2.0-flash","messages":[{"role":"user","content":"你好"}],"stream":true}'
```

协议兼容不等于行为等价。模型名称、上下文窗口、速率限制、配额、安全策略和错误形态由 Gemini Web 控制，接入生产系统前应自行建立契约测试和容量边界。

## 安全底线

- 不要将服务直接绑定到公网；使用反向代理、HTTPS、访问控制和限流。
- 不要提交 `.env`、Cookie、`gemini-auth-state.json`、API Key、代理凭据、请求体或浏览器 Profile。
- Cookie 泄露后应立即在 Google 账号安全设置中撤销会话。
- 日志、错误、截图和诊断信息必须脱敏，不得包含 Cookie 值、API Key、账号邮箱或请求正文。
- 认证数据目录应放在仓库之外，并按凭据存储进行权限保护。

## 开发与文档

```bash
npm run build
npm test
npm run docs:build
```

- [中文文档站入口](docs/zh/index.md)
- [快速开始](docs/zh/guide/quickstart.md)
- [认证流程](docs/zh/guide/authentication.md)
- [API 使用](docs/zh/guide/api-usage.md)
- [配置参考](docs/zh/reference/configuration.md)
- [架构总览](docs/zh/architecture/overview.md)

本仓库尚未声明开源许可证。在加入 `LICENSE` 并明确版权归属前，不应假设代码可以自由复制、修改或再分发。
