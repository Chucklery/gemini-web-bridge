# 常用工作流

这页按任务组织操作步骤。你不需要先读完整个架构，就能从一个明确目标开始。

## 我想第一次运行服务

1. 安装 Node.js 24+、Chrome/Edge 和项目依赖。
2. 复制 `.env.example` 为 `.env`，设置本地 `API_KEY`。
3. 执行 `npm run auth -- login`，在项目专用窗口完成登录。
4. 执行 `npm run build && npm start`。
5. 用 `GET /health` 和 `GET /v1/models` 完成冒烟检查。

详细步骤：[快速开始](./quickstart)。

## 我想接入一个客户端

1. 选择客户端支持的协议：OpenAI、Anthropic 或 Google。
2. 将 base URL 指向 `http://127.0.0.1:8787/v1`（Google 使用对应的 `/v1beta` 路径）。
3. 配置与服务端相同的 Bearer API key。
4. 先进行非流式请求，再启用 `stream: true`。
5. 为模型名、错误结构、上下文限制和流式终态写契约测试。

详细示例：[调用兼容 API](./api-usage)。

## 我想恢复失效登录

1. 执行 `npm run auth -- status`，确认当前状态。
2. 执行 `npm run auth -- refresh` 做一次无交互刷新。
3. 如果需要 Google 交互验证，执行 `npm run auth -- login`。
4. 再执行 `npm run doctor` 和一个 `/health` 请求。
5. 不要把旧 Cookie 直接写进日志或提交到 Issue。

详细原理：[认证与 Cookie 生命周期](../architecture/auth-lifecycle)。

## 我想修改代码并提交 PR

1. 先运行 `npm run build && npm test` 建立绿色基线。
2. 找到对应层：路由、adapter、账户池、Provider、transport 或认证。
3. 为成功、失败、取消和重试路径补测试。
4. 同步更新 `docs/` 中的流程、配置或接口说明。
5. 提交前运行：

```bash
npm run build
npm test
npm run docs:build
```

详细清单：[贡献者工作流](./contributing)。

## 下一步

- 想了解请求如何穿过系统：阅读[架构总览](../architecture/overview)。
- 想查变量和端点：阅读[参考](../reference/configuration)。
- 想改进 Provider 抽象：阅读[演进路线](../architecture/evolution)。
