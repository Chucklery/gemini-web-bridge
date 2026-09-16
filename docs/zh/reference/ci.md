# 测试与发布

提交前运行：

~~~~bash
npm run build
npm test
npm run docs:build
~~~~

文档 workflow 会构建 VitePress 站点，并从 main 分支发布 Pages artifact。站点默认使用 /gemini-web-bridge/ base；自定义域名可将 DOCS_BASE 设置为 /。

发布失败时检查 Actions build job；本地 docs:build 可以复现 Markdown、链接和主题配置问题。
