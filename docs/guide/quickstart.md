# 快速开始

## 1. 安装

```bash
git clone https://github.com/Chucklery/gemini-web-bridge.git
cd gemini-web-bridge
npm install
cp .env.example .env
```

需要 Node.js 24 或更高版本。浏览器认证还需要本机安装 Chrome 或 Microsoft Edge；项目不会下载 Chromium。

## 2. 配置

默认配置：

```dotenv
GEMINI_AUTH_MODE=auto
GEMINI_AUTH_PROFILE=default
GEMINI_BROWSER_CHANNEL=auto
HOST=127.0.0.1
PORT=8787
API_KEY=change-this-local-key
```

先执行登录，再启动服务：

```bash
npm run auth -- login
npm run build
npm start
```

另开终端检查：

```bash
curl http://127.0.0.1:8787/health
curl -H 'Authorization: Bearer change-this-local-key' http://127.0.0.1:8787/v1/models
```

## 3. 生成客户端配置

查看配置摘要：

```bash
npm run setup
npm run setup -- codex
```

`setup -- codex` 只输出本地 Provider 配置模板，不会读取或打印 Cookie 值。

## 4. 最小闭环

```text
安装依赖 → 配置 .env → auth login → build → start → health → 发起请求
```

任何一步失败，先查看[故障排查](./troubleshooting)，再检查[环境变量](../reference/configuration)。
