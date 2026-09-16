# 故障排查

## 找不到浏览器

安装 Chrome/Edge，或设置 `GEMINI_BROWSER_CHANNEL` / `GEMINI_BROWSER_EXECUTABLE_PATH`。也可以临时切换到 `GEMINI_AUTH_MODE=env`。不要通过关闭浏览器安全功能绕过登录阻断。

## `auth_required` 或 bootstrap 失败

先运行 `npm run auth -- status`，再运行 `npm run auth -- refresh`。若 Google 要求交互验证，执行 `login` 并在可见窗口完成。确认系统时间、代理和浏览器版本正常。

## SSE 断流或客户端显示重连

确认服务没有被反向代理缓冲；SSE 代理应关闭 buffering，并将 read timeout 设置得高于 `GEMINI_STREAM_STALL_TIMEOUT_MS`。区分“心跳维持连接”和“上游总执行超时”：心跳不能让已经卡死的上游无限运行。

## 请求失败但无法定位

使用脱敏后的配置摘要、Node.js 版本、操作系统和复现步骤提交 Issue。不要上传 Cookie、API key、账号邮箱、浏览器 Profile、截图或请求正文。
