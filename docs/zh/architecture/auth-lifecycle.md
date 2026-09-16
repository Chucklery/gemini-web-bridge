# 认证与 Cookie 生命周期

浏览器负责持久登录会话，服务只使用经过校验的本地认证状态：

~~~~text
浏览器配置/恢复 → CookiePolicy → gemini-auth-state.json
                                      ↓
                         FileCookieSource → CookieJar → HTTP transport
~~~~

登录成功后，状态保存到账号专用 Profile 目录。正常启动时优先读取该文件，不启动浏览器；Gemini 客户端通过 HTTP 完成 bootstrap、模型发现和生成。

只有状态缺失、过期、显式执行 npm run auth -- refresh 或需要认证恢复时才会启动浏览器。恢复成功后会原子替换状态文件和内存 CookieJar。

状态文件使用目录 0700、文件 0600 权限。它等同于登录凭据，不要提交、记录、复制或上传。
