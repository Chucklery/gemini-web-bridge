# Gemini Web Bridge（中文）

中文文档入口。默认英文文档请返回 [English](../)。

## 从这里开始

- [快速开始](./guide/quickstart)
- [认证流程](./guide/authentication)
- [API 使用](./guide/api-usage)
- [故障排查](./guide/troubleshooting)

首次配置或认证恢复时才需要浏览器。配置完成后，服务读取认证状态文件，通过 Node HTTP transport 调用 Gemini Web；正常启动和请求不会启动浏览器，也不会执行 Gemini 前端脚本。
