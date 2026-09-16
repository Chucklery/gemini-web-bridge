# 快速开始

需要 Node.js 24 或更高版本，以及本机 Chrome 或 Microsoft Edge。

```bash
npm install
cp .env.example .env
npm run auth -- login
npm run build
npm start
```

首次登录后，认证状态会保存到账号专用目录。之后启动服务不再需要浏览器。会话失效时执行 npm run auth -- refresh。
