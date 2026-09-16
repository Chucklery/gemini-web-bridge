# Gemini Web Bridge

把 Gemini Web 会话变成一个本地、可审计、兼容 OpenAI / Anthropic / Google 请求格式的 HTTP 服务。

<div class="tip custom-block"><p class="custom-block-title">文档目标</p><p>这是一份面向贡献者和集成开发者的“能跑起来、看懂原理、知道如何改”的文档。功能状态以当前源码为准。</p></div>

## 先走哪条路径？

- **第一次运行**：从[快速开始](/guide/quickstart)开始，使用项目专用浏览器 Profile 完成登录。
- **接入客户端**：阅读[调用兼容 API](/guide/api-usage)和[HTTP 端点](/reference/endpoints)。
- **修改实现**：先看[架构总览](/architecture/overview)，再看对应的认证、流式或账户池流程。
- **发布文档**：推送到 `main` 后，GitHub Actions 会构建并发布 `docs/`。

## 设计原则

1. **凭据最小暴露**：浏览器只负责登录与导出受限 Cookie 快照；服务不读取日常浏览器 Profile。
2. **协议边界清晰**：入站兼容协议、内部生成语义和 Gemini Web 私有协议分层。
3. **失败可解释**：认证失效、限流、上游故障、取消和不支持能力不混为一谈。
4. **流式有确定终态**：客户端取消、上游超时和网络错误都必须结束在可识别的状态。

## 重要提醒

本项目不是 Google 官方 API。Cookie 等同于登录凭据；不要提交到 Git、日志、截图或第三方服务。当前仓库仍处于早期开发阶段，生产使用前请自行建立契约测试和安全边界。
