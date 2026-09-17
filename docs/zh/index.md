# Gemini Web Bridge 中文文档

Gemini Web Bridge 将 Gemini Web 会话转换为本地 HTTP 服务，并提供 OpenAI、Anthropic 和 Google 兼容接口。

## 推荐阅读路径

1. [快速开始](./guide/quickstart)
2. [认证流程](./guide/authentication)
3. [API 使用](./guide/api-usage)
4. [配置参考](./reference/configuration)
5. [架构总览](./architecture/overview)
6. [Google Gemini Web Provider 开发文档](./architecture/google-web-client-development)
7. [故障排查](./guide/troubleshooting)

## 运行模型

浏览器只负责首次登录和显式认证恢复，不是在线请求的运行时依赖。认证成功后，服务读取项目专用的认证状态文件，通过 Node.js HTTP transport 完成 bootstrap、模型发现、生成和流式读取；正常启动与请求不会启动浏览器，也不会执行 Gemini 前端脚本。

## 文档约定

文档中的“兼容”表示接口形状和主要字段可供对应客户端使用，不表示与官方 API 的模型能力、限流、计费、上下文上限或错误语义完全相同。生产接入前请建立针对自身业务的契约测试。
