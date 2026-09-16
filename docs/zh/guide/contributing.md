# 贡献指南

## 开始前

~~~~bash
npm install
npm run build
npm test
~~~~

保持 route、adapter、provider、transport 和认证层边界清晰。为成功、失败、取消和重试路径补充测试；涉及凭据时还要增加脱敏断言。

## 检查清单

- 不提交 .env、Cookie、API key、浏览器 Profile 或诊断截图。
- 不读取用户日常浏览器 Profile，不开放外部 CDP 端口，也不自动填写账号信息。
- 行为或配置变化时同步更新相关文档。
- 提交 PR 前运行 npm run build、npm test 和 npm run docs:build。
