# 故障排查

认证失败时先执行 npm run auth -- status，再执行 npm run auth -- refresh。若 Google 要求交互验证，执行 npm run auth -- login 并在可见窗口完成。

SSE 断流时关闭反向代理 buffering，并将 read timeout 设置得高于 GEMINI_STREAM_STALL_TIMEOUT_MS。
