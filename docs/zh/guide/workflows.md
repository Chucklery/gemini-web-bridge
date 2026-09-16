# 常用工作流

## 首次部署

1. 安装 Node.js 24+、Chrome/Edge 和项目依赖。
2. 复制 `.env.example` 为 `.env`，设置本机监听地址与随机 API Key。
3. 执行 `npm run auth -- login`，在专用窗口完成登录。
4. 执行 `npm run build && npm start`。
5. 使用 `/health` 和带认证的 `/v1/models` 做冒烟检查。

## 会话恢复

1. 执行 `npm run auth -- status`，确认状态摘要和过期时间。
2. 执行 `npm run auth -- refresh`。
3. 若需要 Google 交互验证，执行 `npm run auth -- login`。
4. 执行 `npm run doctor` 并重新检查 `/health`。

## 通过代理部署

将 `GEMINI_PROXY` 指向 HTTP/HTTPS 代理，验证代理能够访问 Gemini Web。生产环境仍应让服务监听内网或回环地址，由反向代理负责 HTTPS、认证、限流和访问日志脱敏。

## 修改代码

完成 route、adapter、provider、transport 或认证层修改后，运行：

```bash
npm run build
npm test
npm run docs:build
```

协议映射应留在 Adapter 层，Gemini 私有 RPC 细节应留在 Provider 层；不要让路由直接依赖 Cookie 或上游 RPC 字段。
