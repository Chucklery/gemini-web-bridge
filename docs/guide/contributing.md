# 贡献者工作流

## 开始前

```bash
npm install
npm run build
npm test
```

先确认基线通过，再开始修改。认证、流式协议、账户调度和错误处理属于高风险边界，优先阅读对应的[架构原理](/architecture/overview)。

## 修改流程

1. 用 Issue 或 PR 描述行为变化、影响范围和无法覆盖的风险。
2. 保持 route、adapter、Provider、transport 的边界；不要在路由里直接增加 Gemini RPC 细节。
3. 为正常、失败、取消和重试路径补测试；涉及凭据时补脱敏断言。
4. 同步更新 `docs/` 下的使用步骤、配置表或架构说明。
5. 本地执行完整检查：

```bash
npm run build
npm test
npm run docs:build
```

## 提交与审查清单

- 不提交 `.env`、Cookie value、API key、浏览器 Profile 或诊断截图。
- 不读取用户日常浏览器 Profile，不开放外部 CDP 端口，不自动填写账号密码。
- 流式改动验证 headers、心跳、取消、唯一终态和重复提交风险。
- 文档中的接口与功能状态和源码一致。
- PR 说明测试命令和任何已知的 Google/Gemini Web 行为漂移。

## 文档本地预览

```bash
npm run docs:dev
```

浏览器打开终端提示的本地地址。VitePress 会自动生成导航搜索和页面路由；新页面加入 sidebar 后即可出现在站点中。
