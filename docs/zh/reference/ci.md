# 测试与发布

## 本地检查

提交前运行：

```bash
npm run build
npm test
npm run docs:build
```

开发阶段可以使用 `npm run test:watch` 持续运行测试，使用 `npm run docs:dev` 预览 VitePress 文档。

## 检查重点

- TypeScript 编译必须通过；
- 认证状态、Cookie 和 API Key 不得出现在日志、错误或测试快照；
- 流式成功、上游错误、客户端取消、stall timeout 和终态事件均应有覆盖；
- 重试只能发生在安全边界内，不能造成重复提交；
- 配置表、端点状态和代码行为保持一致。

## 文档发布

文档通过 VitePress 构建。GitHub Pages 使用 `/gemini-web-bridge/` base path；自定义域名部署时将 `DOCS_BASE` 设为 `/`。发布失败时先检查 Actions 的 build job，再在本地运行 `npm run docs:build` 复现 Markdown、链接或主题配置问题。
