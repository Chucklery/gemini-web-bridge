---
layout: home
---

<div class="hero-panel">
  <p class="hero-kicker">Developer documentation · v0.1</p>
  <h1>Gemini Web Bridge</h1>
  <p class="hero-lead">把 Gemini Web 会话转换为本地、可审计、兼容 OpenAI / Anthropic / Google 请求格式的 HTTP 服务。</p>
  <div class="hero-actions">
    <a href="/gemini-web-bridge/guide/quickstart">快速开始</a>
    <a href="/gemini-web-bridge/architecture/overview">阅读架构</a>
    <a href="https://github.com/Chucklery/gemini-web-bridge">查看源码 ↗</a>
  </div>
</div>

<div class="feature-grid">
  <div class="feature-card"><div class="feature-icon">01</div><h3>兼容协议入口</h3><p>通过熟悉的 OpenAI、Anthropic 和 Google API 形态接入本地 Gemini Web 会话。</p></div>
  <div class="feature-card"><div class="feature-icon">02</div><h3>凭据最小暴露</h3><p>使用项目专用浏览器 Profile，服务只接收经过校验的内存 Cookie 快照。</p></div>
  <div class="feature-card"><div class="feature-icon">03</div><h3>流式生命周期</h3><p>围绕 SSE 心跳、取消、超时、确定终态和短 TTL 重放建立可诊断流程。</p></div>
</div>

## 从这里开始

把下面的路径当作文档站的入口，而不是从代码目录开始猜：

| 我想做什么 | 从这里开始 |
| --- | --- |
| 第一次运行服务 | [快速开始](./guide/quickstart) |
| 调用兼容 API | [API 使用指南](./guide/api-usage) |
| 理解请求链路 | [架构总览](./architecture/overview) |
| 排查认证或断流 | [故障排查](./guide/troubleshooting) |
| 修改代码并提交 PR | [贡献者工作流](./guide/contributing) |

<div class="tip custom-block"><p class="custom-block-title">文档目标</p><p>这是一份面向贡献者和集成开发者的“能跑起来、看懂原理、知道如何改”的文档。功能状态以当前源码为准。</p></div>

## 先走哪条路径？

- **第一次运行**：从[快速开始](/guide/quickstart)开始，使用项目专用浏览器 Profile 完成登录。
- **接入客户端**：阅读[调用兼容 API](/guide/api-usage)和[HTTP 端点](/reference/endpoints)。
- **修改实现**：先看[架构总览](/architecture/overview)，再看对应的认证、流式或账户池流程。
- **发布文档**：推送到 `main` 后，GitHub Actions 会构建并发布 `docs/`。

## 下一步

如果你刚接触项目，建议按[常用工作流](./guide/workflows)走一遍完整闭环：安装 → 登录 → 启动 → 请求 → 测试 → 发布。

## 设计原则

1. **凭据最小暴露**：浏览器只负责登录与导出受限 Cookie 快照；服务不读取日常浏览器 Profile。
2. **协议边界清晰**：入站兼容协议、内部生成语义和 Gemini Web 私有协议分层。
3. **失败可解释**：认证失效、限流、上游故障、取消和不支持能力不混为一谈。
4. **流式有确定终态**：客户端取消、上游超时和网络错误都必须结束在可识别的状态。

## 重要提醒

本项目不是 Google 官方 API。Cookie 等同于登录凭据；不要提交到 Git、日志、截图或第三方服务。当前仓库仍处于早期开发阶段，生产使用前请自行建立契约测试和安全边界。
