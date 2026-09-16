# 测试与发布

本地提交前：

```bash
npm run build
npm test
npm run docs:build
```

## GitHub Pages

`.github/workflows/docs.yml` 会在 `main` 分支的 `docs/**`、源码或 workflow 变化时运行：安装依赖 → `vitepress build docs` → 上传 Pages artifact → 发布。首次启用时，在仓库 Settings → Pages → Build and deployment → Source 选择 **GitHub Actions**。

站点使用 `/gemini-web-bridge/` base，因为仓库不是 `Chucklery.github.io` 用户站点；若迁移到自定义域名，可将 workflow 中的 `DOCS_BASE` 改为 `/`。

发布失败时先查看 Actions 的 build job；本地 `npm run docs:build` 能复现 Markdown、链接和主题配置问题。
