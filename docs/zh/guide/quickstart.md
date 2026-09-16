# 快速开始

## 1. 环境准备

需要 Node.js 24+、Google 账号，以及本机安装的 Chrome 或 Microsoft Edge。项目不会下载 Chromium。

## 2. 安装

```bash
git clone https://github.com/Chucklery/gemini-web-bridge.git
cd gemini-web-bridge
npm install
cp .env.example .env
```

编辑 `.env`。建议服务仅监听本机，并设置随机的本地 API Key：

```dotenv
HOST=127.0.0.1
PORT=8787
API_KEY=change-this-local-key
GEMINI_AUTH_MODE=auto
GEMINI_AUTH_PROFILE=default
GEMINI_BROWSER_CHANNEL=auto
```

## 3. 登录

```bash
npm run auth -- login
```

命令打开项目专用窗口。请在窗口中手工完成登录及可能出现的验证步骤。成功后，经过校验的 Cookie 快照会写入账号专用目录，默认路径见[配置参考](../reference/configuration)。

## 4. 启动

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

若 `API_KEY` 为空，兼容 API 不要求 Authorization；但不建议在非本机网络中这样运行。

## 5. 会话恢复

认证失效时执行：

```bash
npm run auth -- status
npm run auth -- refresh
```

如果 Google 要求重新交互验证，改用 `npm run auth -- login`。认证恢复会生成新的状态快照；服务正常运行期间不会自动打开浏览器。
