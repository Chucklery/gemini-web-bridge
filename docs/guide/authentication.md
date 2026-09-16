# 认证流程

## 推荐：浏览器认证

`GEMINI_AUTH_MODE=auto` 或 `browser` 时，认证流程是：

```text
npm run auth -- login
        ↓
系统 Chrome/Edge + 项目专用 persistent Profile
        ↓ 用户自行完成 Google 登录
browserContext.cookies(Gemini URL)
        ↓ allowlist 校验、保留原始 domain/path
进程内 Cookie Jar → Gemini bootstrap 冒烟验证
```

应用不会自动填写账号、密码、验证码或 Passkey，也不会接管日常浏览器 Profile。`GEMINI_AUTH_PROFILE` 只作为本地隔离标识，不应使用邮箱作为目录名。

常用命令：

```bash
npm run auth -- login    # 首次登录或手动重新登录
npm run auth -- status   # 输出状态、版本和 Cookie 数量，不输出值
npm run auth -- refresh  # 刷新会话
npm run auth -- logout   # 清理项目会话
```

## 兼容：环境变量 Cookie

找不到受支持浏览器时，可显式启用：

```dotenv
GEMINI_AUTH_MODE=env
GEMINI_COOKIES='[{"name":"SID","value":"...","domain":".google.com","path":"/"}]'
```

必须使用从浏览器导出的真实 domain、path、secure、httpOnly 和过期信息。不要把占位 Cookie 当成可运行配置。

## 安全边界

- Cookie 是完整登录凭据；泄露后应立即在 Google 账号侧注销相关会话。
- 不要将 `.env`、Profile、诊断包、请求正文或 API key 提交到仓库。
- 不要把服务直接绑定到公网；对外使用 HTTPS、强随机 API key、反向代理和限流。
- 认证失败采用 fail-closed，不回退到匿名请求或伪装成功。
