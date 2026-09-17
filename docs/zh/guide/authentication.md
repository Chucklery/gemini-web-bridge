# 认证流程

## 认证模式

- `auto)：默认模式，使用项目专用浏览器 Profile；必要时走浏览器认证。
- `browser)：显式启用浏览器认证，行为与 `auto` 相同。
- `env)：兼容救援模式，从 `GEMINI_COOKIES` 读取 Cookie，不依赖浏览器。

推荐使用 `auto`。它将“交互式登录”和“无头服务运行”分离，降低凭据暴露面及部署依赖。

## CLI 操作

```bash
npm run auth -- login    # 首次登录或交互式重新登录
npm run auth -- status   # 查看状态摘要，不打印 Cookie
npm run auth -- refresh  # 显式执行浏览器恢复
npm run auth -- logout   # 删除项目专用认证 Profile
```

`status` 只输出 ready、revision、获取/过期时间和 Cookie 数量等摘要。失败时会输出脱敏错误。

如果 Google 拦截项目专用窗口并显示“请尝试使用其他浏览器”，可在日常 Chrome 中完成 Gemini 登录后执行一次性导入：

```bash
npm run auth -- import-chrome
```

该命令读取 Chrome Cookie 数据库的临时副本，只导出 Google/Gemini Cookie，然后写入项目自己的 `gemini-auth-state.json`。它不接管正在运行的 Chrome，也不读取密码、验证码或页面内容。检测到多个 Profile 时，必须设置 `GEMINI_CHROME_PROFILE_NAME` 指定 `Default` 或 `Profile 2` 等目录名。

## 生命周期

```text
浏览器登录/恢复
      ↓
CookiePolicy 校验
      ↓
gemini-auth-state.json（原子写入）
      ↓
FileCookieSource → CookieJar → Node HTTP transport
      ↓
bootstrap → 模型发现 → 生成/流式响应
```

首次登录成功后，服务从状态文件加载 Cookie；认证状态缺失、过期或显式执行 `refresh` 时才需要浏览器。并发请求触发恢复时，SessionManager 采用 single-flight，避免重复刷新；正在执行的请求继续使用已验证的客户端，替换会话验证成功后才切换。

## 无浏览器兼容模式

```dotenv
GEMINI_AUTH_MODE=env
GEMINI_COOKIES='[{"name":"SID","value":"真实值","domain":".google.com","path":"/","secure":true,"httpOnly":true}]'
```

必须填写来源浏览器中的真实 `domain`、`path`、`secure`、`httpOnly` 和过期属性。占位 Cookie 无法认证；Cookie 只保留在进程内，但仍应避免出现在 shell 历史、进程列表和日志中。

## 安全边界

认证状态文件和 Cookie 都是完整登录凭据。项目默认不会读取日常浏览器 Profile、连接已有浏览器、开放外部 CDP 端口或填写密码、验证码、Passkey；只有用户明确执行 `import-chrome` 时才会读取 Chrome Cookie 数据库的临时副本。认证失败会失败关闭，不会发起匿名请求。
