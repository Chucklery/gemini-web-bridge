# 认证流程

```bash
npm run auth -- login
npm run auth -- status
npm run auth -- refresh
npm run auth -- logout
```

登录成功后，Cookie 快照保存为账号目录中的 gemini-auth-state.json。正常启动、模型发现、生成和流式响应均通过 Node HTTP transport 完成，不启动浏览器，也不执行 Gemini 前端脚本。

只有认证状态缺失、过期或显式执行 refresh 时才需要浏览器。
