# Gemini 登录态自动获取与 Codex 断线治理开发方案

## 1. 目标与结论

本方案解决两个相互关联的问题：

1. 用户不再手工复制 `SID`、`SAPISID`、`APISID` 到 `.env`；应用通过一个可见、持久化、由本机用户控制的浏览器登录窗口获取 Gemini 登录态。
2. 将本项目的 OpenAI Responses 流式接口补齐为 Codex 可稳定消费的 SSE，实现心跳、取消、终态和安全重放，避免本地桥接引起 `Reconnecting`。

推荐实现是“系统浏览器的项目专用 Profile 拥有登录态，服务使用经过校验的本地认证状态快照”。认证辅助器使用 `playwright-core`，不下载或随应用打包 Chromium；它只在首次登录、认证失效或手动刷新时短暂启动本机 Chrome/Edge，完成后立即退出：

```text
用户在项目启动的系统 Chrome/Edge 窗口登录 Google
                  │
                  ▼
项目专用 persistent profile（不使用日常浏览器 Profile）
                  │ browserContext.cookies(Gemini URL)
                  ▼
BrowserCookieSource ──校验/脱敏/版本化──▶ GeminiCookies（内存）
                                             │
                                             ▼
                              GeminiClient / AccountPool
                                             │
                                             ▼
                            OpenAI Responses SSE + heartbeat
                                             │
                                             ▼
                                           Codex
```

不建议读取用户现有 Chrome/Edge Cookie 数据库、启动远程调试端口接管日常浏览器，或自动填写账号密码。这些方式跨平台脆弱，扩大凭据暴露面，也难以给出可靠的登出和账号隔离语义。

## 2. 参考实现中应复用的设计

本方案基于 `miuuyy/codex-chatgpt-web` 的 `973c287edf53c37d3d9fa2356010d635a6ccf25b` 版本进行分析。参考项目并不导出 ChatGPT Cookie；它更重要的设计是：

- 参考项目的 Launcher 拥有独立的 `persist:` Electron 分区，登录和真实请求使用同一分区；本项目用专用 Playwright Profile 实现同等隔离语义。
- 参考项目要求用户在可见窗口中完成登录，并将身份提供方弹窗保留在同一浏览器会话内；本项目沿用这项交互边界。
- 登录成功不能只看页面元素，必须同时验证服务端会话和可操作页面。
- 先执行冒烟测试，再把 Provider 暴露给 Codex。
- 浏览器状态、健康探测、心跳、任务租约和日志均有清晰生命周期；UI 或协议漂移时失败关闭，不伪造成功。
- SSE 在上游沉默期间发送心跳，并且始终发出确定的 `response.completed`；同一 Codex 请求重连时复用原执行和事件日志，避免重复提交。

参考资料：

- [codex-chatgpt-web 架构](https://github.com/miuuyy/codex-chatgpt-web/blob/main/docs/architecture.md)
- [codex-chatgpt-web 安全模型](https://github.com/miuuyy/codex-chatgpt-web/blob/main/docs/security-model.md)
- [codex-chatgpt-web 故障排查](https://github.com/miuuyy/codex-chatgpt-web/blob/main/TROUBLESHOOTING.md)
- [Playwright BrowserType：持久 Context 与浏览器 channel](https://playwright.dev/docs/api/class-browsertype)
- [Playwright BrowserContext：按 URL 获取 Cookie](https://playwright.dev/docs/api/class-browsercontext#browser-context-cookies)

这里不复制参考项目的 ChatGPT DOM 自动化逻辑。本项目只借鉴其会话所有权、隔离、验证、心跳和重连模型。

## 3. 当前代码差距

### 3.1 认证

- `cli/server.ts` 只读取 `GEMINI_COOKIES`，没有 Cookie 来源抽象、自动登录或运行时刷新。
- `.env.example` 把 `SID` 的 domain 写成 `gemini.google.com`；真实 Cookie 的原始 domain/path/secure/httpOnly 属性必须保留，不能在导入时改写作用域。
- `GeminiCookies.replace()` 是全量清空后逐条写入。刷新中途失败会让账户暂时处于半更新状态。
- `UndiciTransport` 只从 Cookie Header 中提取 `SAPISID` 构造 `SAPISIDHASH`，但没有认证失效分类或刷新回调。
- Cookie 可能通过环境变量、进程信息、调试日志、错误对象或诊断包泄漏。

### 3.2 Codex/流式响应

- `/v1/responses` 目前忽略 `stream`，只返回一次性 JSON，不是完整 Responses SSE。
- `/v1/chat/completions` 没有心跳、`Connection: keep-alive`、`X-Accel-Buffering: no`、客户端取消传播和 headers 已发送后的错误终态。
- 没有稳定 request/turn identity，也没有断线后的事件重放；Codex 自动重试可能再次提交同一个 Gemini 请求。
- 长时间无文本增量会被 Codex 识别为 idle stream，从而出现 `Reconnecting`。
- 当前测试只覆盖 Gemini 增量去重，没有覆盖 SSE 生命周期、断线、重连和重复提交。

## 4. 认证方案选型

| 方案 | 用户体验 | 安全性 | 跨平台 | 结论 |
|---|---:|---:|---:|---|
| 手工复制 Cookie | 差 | 中 | 高 | 保留为兼容/救援模式 |
| 读取 Chrome Cookie DB | 好 | 低 | 低 | 仅作为显式一次性导入 |
| CDP 接管现有浏览器 | 中 | 低 | 中 | 不作为正式方案 |
| `playwright-core` + 系统 Chrome/Edge + 独立 Profile | 好 | 高 | 高 | **首选** |
| Playwright 下载自带 Chromium | 好 | 中 | 高 | 默认不启用，仍然增加较大下载 |
| 独立 Electron 持久分区 | 好 | 高 | 高 | 可选桌面 Launcher，不作为核心依赖 |

首期继续让现有 Undici Transport 发请求，只把系统浏览器专用 Profile 中的 Cookie 快照同步到进程内存。`playwright-core` 作为 optional dependency，不执行 Playwright 的浏览器下载；运行时优先使用显式配置的 channel，否则依次探测 Chrome、Edge，`executablePath` 仅作为高级救援配置。找不到受支持浏览器时给出明确错误，并保留 `GEMINI_COOKIES` 兼容模式。

已知限制是 Google 可能调整自动化浏览器的登录策略，系统浏览器升级也可能暂时超出当前 Playwright 的兼容范围。实现不得通过关闭浏览器安全功能或加入“反检测”补丁绕过限制；遇到登录阻断时明确失败并提示升级 `playwright-core`、改用另一受支持 channel，或显式切换到 `env` 救援模式。

当 Google 拦截项目专用登录窗口时，提供 `npm run auth -- import-chrome` 作为显式的一次性兼容路径。它只复制 Chrome Cookie 数据库到 owner-only 临时目录，通过本机 Chrome 解密后筛选 Google/Gemini Cookie，保存到项目认证状态并立即清理临时目录；正常启动仍不读取日常 Profile，也不接管正在运行的浏览器。

## 5. 目标模块

建议新增以下边界：

```text
src/auth/
  cookie-source.ts              # CookieSource 接口和快照类型
  env-cookie-source.ts          # 兼容 GEMINI_COOKIES
  browser-cookie-source.ts      # 调用按需浏览器认证辅助器
  cookie-policy.ts              # allowlist、domain、过期时间校验
  auth-validator.ts             # Gemini bootstrap 冒烟验证
  redaction.ts                  # 日志/错误统一脱敏
  session-manager.ts            # 刷新、退避、状态机、single-flight

src/browser-auth/
  browser-discovery.ts          # Chrome/Edge channel 与 executable path 探测
  persistent-context.ts         # Playwright persistent context 生命周期
  profile-path.ts               # 每账户独立的项目 Profile 路径
  login-flow.ts                 # 可见登录、导航约束、登录完成判断
  cookie-export.ts              # browserContext.cookies(URL)
  chrome-profile.ts             # 日常 Chrome Profile 发现与临时 Cookie 数据库副本
  chrome-cookie-import.ts       # 显式一次性 Chrome Cookie 导入
  state.ts                      # signed_out/authenticating/ready/expired/error

src/server/streaming/
  responses-sse.ts              # Responses 事件编码与确定终态
  heartbeat.ts                  # 空闲心跳
  replay-journal.ts             # 有界、短 TTL 的同请求事件日志
  disconnect.ts                 # req.raw close -> AbortController
```

核心接口：

```ts
export interface CookieSnapshot {
  revision: string;       // 只用随机 ID 或 HMAC；不得使用原始值拼接日志
  accountHint?: string;   // 可选、脱敏后的账号标识
  acquiredAt: number;
  expiresAt?: number;
  cookies: StoredCookie[];
}

export interface CookieSource {
  current(signal?: AbortSignal): Promise<CookieSnapshot>;
  refresh(reason: 'startup' | 'expired' | 'unauthorized' | 'manual', signal?: AbortSignal): Promise<CookieSnapshot>;
  close?(): Promise<void>;
}
```

`Account` 不直接知道 Playwright。`SessionManager` 取得并验证快照后，原子地构造一个新的 `GeminiCookies`/`GeminiClient`，验证成功才替换账户当前客户端；正在执行的请求继续使用旧快照，避免刷新中断流。

## 6. 自动登录与 Cookie 获取流程

### 6.1 首次登录

1. `npm run auth -- login` 通过 `playwright-core` 启动本机 Chrome/Edge 的可见窗口。
2. 使用固定、项目私有的 `userDataDir`，绝不复用或读取用户日常浏览器 Profile。
3. 只允许自动化逻辑操作 `gemini.google.com`、`accounts.google.com` 以及登录必需的 Google 域；遇到其他来源的页面或弹窗时停止流程并提示用户，不读取页面内容。
4. 用户自行输入账号、密码、验证码和 Passkey；应用不读取表单内容。
5. 回到 Gemini 后同时检查：URL/页面状态符合预期，以及取得 Cookie 后由现有 Gemini Client 发起 bootstrap 冒烟请求并得到有效响应。
6. `browserContext.cookies('https://gemini.google.com/')` 获取对该 URL 生效的 Cookie，包括 HttpOnly Cookie。
7. `CookiePolicy` 选择需要的 Cookie，保留 name、value、domain、path、expirationDate、secure、httpOnly、sameSite，不改写 domain。
8. 至少要求 `SID`、`SAPISID`、`APISID`；实际请求还应携带对 Gemini URL 生效且在明确 allowlist 中的 Google 会话 Cookie，例如相应的 `__Secure-*` 变体。是否“够用”以 bootstrap 冒烟测试结果为准，不把 Cookie 名单当成永久协议。
9. 快照在同一 Node 进程内直接交给 `SessionManager`；若以后改成子进程，只允许通过父子进程私有管道传输，禁止 loopback 公共接口。
10. 关闭 Context 前等待专用 Profile 落盘；验证成功后关闭浏览器进程，下次启动继续复用该 Profile。

### 6.2 启动与静默恢复

```text
服务启动
  ├─ GEMINI_AUTH_MODE=env      -> 读取现有 GEMINI_COOKIES
  ├─ GEMINI_AUTH_MODE=browser  -> 按需启动系统 Chrome/Edge
  └─ GEMINI_AUTH_MODE=auto     -> 先 browser，未初始化时才提示登录；不静默降级到过期 env Cookie
```

已有专用 Profile 时，启动一个短生命周期的无头 Context 读取 Cookie 并进行 bootstrap 冒烟测试，随后立即退出。若浏览器或 Google 不允许该 Profile 无头运行，则回退到可见但不自动填写内容的恢复窗口。只有登录失效、Google 要求交互验证或用户执行 `auth login` 时才要求用户操作。

### 6.3 刷新与失效

- 不保持常驻浏览器，也不持续监听 Cookie。Gemini 认证失败、接近 Cookie 过期时间或用户手动刷新时，按需重新启动短生命周期 Context 并生成新快照。
- Gemini 返回 401/403、bootstrap 重定向到登录页或缺失动态参数时，错误分类为 `authentication`。
- 同一 revision 只触发一次刷新；并发请求共享 single-flight，防止同时弹出多个登录窗口。
- 同一 Profile 同时只允许一个浏览器进程持有；启动前检测锁冲突，不能删除另一个活跃进程的锁文件。
- 自动刷新只做一次无交互重取和验证。仍失败则账户进入 `auth_required`，停止重试并提示用户登录。
- 登出会关闭相关 Context，清理项目专用 Profile 及内存 CookieJar；不影响用户日常 Chrome/Edge Profile。

### 6.4 多账户

每个账户使用独立 Profile 目录，例如 `<app-data>/browser-profiles/<account-id>`。账户 ID 是随机本地标识，不使用邮箱作为目录名。账户池只调度状态为 `ready` 的账户；`auth_required`、`refreshing` 和 `disabled` 不参与选择。

## 7. 安全约束

- Cookie 是完整登录凭据，任何日志、trace、异常、快照测试和 HTTP 响应都不得包含 Cookie value。
- 登录成功后将经过校验的 Cookie 快照原子写入项目专用 Profile 目录中的 `gemini-auth-state.json`，目录使用 0700、文件使用 0600。服务重启时优先读取该状态文件；只有状态缺失、失效或显式恢复时才启动浏览器。
- 浏览器启动参数、Profile 路径和 executable path 只来自本机配置，不能由 HTTP 请求控制；运行前解析并校验为明确的本地文件或目录。
- 若认证辅助器以后拆成子进程，父子进程协议必须版本化并走私有 stdio/IPC，结果只包含 Cookie allowlist，不导出账号密码或本地存储全集。
- Profile 目录、诊断包和 `.env` 必须加入 `.gitignore`；诊断输出只允许 `present/expired/domain/revision` 等元数据。
- 不注入任意页面脚本，不加载扩展，不开放外部 CDP 端口；Playwright 必须直接拥有它启动的浏览器进程和项目专用 Profile。
- `import-chrome` 不是默认认证来源；只复制并筛选临时 Cookie 数据库，不读取密码、页面内容或其他本地存储。
- 禁止附加用户正在运行的浏览器、打开任意 URL、执行页面提供的命令，或向其他本地进程暴露调试接口。
- 认证失败采用 fail-closed：不得回退到匿名请求、其他账号或旧快照并伪装成功。
- 文档和 CLI 要明确这是非官方 Gemini Web 自动化，用户需遵守适用的 Google 条款和组织策略。

## 8. Codex Responses/SSE 与重连治理

### 8.1 完整事件生命周期

`POST /v1/responses` 在 `stream: true` 时至少输出：

```text
response.created
response.output_item.added
response.content_part.added
response.output_text.delta       (0..n)
response.output_text.done
response.content_part.done
response.output_item.done
response.completed
data: [DONE]
```

所有事件具备稳定的 `response_id`、`item_id`、`output_index` 和递增 `sequence_number`。即使 Gemini 没有文本、客户端取消或上游失败，也必须走唯一、可测试的终态；headers 已发送后用 SSE error/failed 事件结束，不能再抛出普通 Fastify JSON 错误。

响应头：

```http
Content-Type: text/event-stream; charset=utf-8
Cache-Control: no-cache, no-transform
Connection: keep-alive
X-Accel-Buffering: no
```

### 8.2 心跳和超时

- 上游无事件期间每 2 秒发送一次 `response.heartbeat`，收到任意 Gemini 事件后重新计时。
- 单独维护“连接活跃超时”和“上游总执行超时”；心跳只能维持下游连接，不能让已卡死的 Gemini 请求永久运行。
- 超过 stall timeout 后发送可诊断失败事件并结束，不继续空心跳。
- 代理部署文档要求禁用 SSE buffering，并将反向代理 read timeout 调大到高于应用 stall timeout。

这里沿用参考项目的做法：使用真实 SSE 事件作为心跳，而不是只依赖 TCP keepalive。应针对当前 Codex 版本建立契约测试，确认未知 `response.heartbeat` 会被忽略但能重置流空闲计时。

### 8.3 取消和重连

- `request.raw` 的 `close`/`aborted` 事件连接到同一个 `AbortController`，向 AccountPool、GeminiClient 和 Undici 请求传播。
- 以客户端提供的 request identity（或对规范化请求做 HMAC）建立 execution key。
- 每个 execution 保存短 TTL、定长的事件 journal；写入 journal 后再写 socket。
- 相同 execution key 重连时先重放完整事件批次，再继续观察同一个上游执行，禁止重新向 Gemini 提交。
- 不同请求不得共享会话、响应 ID 或 journal。
- 只有在尚未提交上游或能证明请求未被接收时才自动重试；一旦收到 session/text/thought 事件，不跨账户重试。
- journal 达到上限、身份冲突或无法证明幂等时明确失败，不猜测恢复。

### 8.4 Codex Provider 配置

本项目只实现 HTTP/SSE，不实现 Responses WebSocket，因此生成给 Codex 的 Provider 配置必须显式声明：

```toml
[model_providers.gemini_web]
name = "Gemini Web Bridge"
base_url = "http://127.0.0.1:8787/v1"
env_key = "GEMINI_WEB2API_KEY"
wire_api = "responses"
supports_websockets = false
request_max_retries = 1
stream_max_retries = 1
stream_idle_timeout_ms = 600000
```

端口、key 名称和 timeout 由 setup 命令按实际配置生成。`supports_websockets = false` 很重要：不能让 Codex 对一个只支持 SSE 的本地桥接先尝试 WebSocket。

## 9. 配置与 CLI

新增配置建议：

```dotenv
GEMINI_AUTH_MODE=auto
GEMINI_AUTH_PROFILE=default
GEMINI_AUTH_TIMEOUT_MS=120000
GEMINI_BROWSER_CHANNEL=auto
# GEMINI_BROWSER_EXECUTABLE_PATH=  # 仅在自动探测失败时设置
GEMINI_BROWSER_HEADLESS_RECOVERY=true
GEMINI_COOKIE_REFRESH_SKEW_MS=300000
GEMINI_SSE_HEARTBEAT_MS=2000
GEMINI_STREAM_STALL_TIMEOUT_MS=120000
GEMINI_REPLAY_TTL_MS=900000
```

保留 `GEMINI_COOKIES`，但仅用于 `env` 兼容模式，并在启动时提示迁移。CLI：

```text
npm run auth -- login [--account <id>]
npm run auth -- status [--json]       # 只输出脱敏状态
npm run auth -- refresh
npm run auth -- logout
npm run setup -- codex                # 生成/校验 Codex Provider 配置
npm run doctor                        # Cookie、bootstrap、SSE、代理和 Codex 配置检查
```

`doctor --json` 必须使用稳定字段并默认脱敏，便于问题报告但不能泄露 Cookie、API key、Profile 路径中的账号信息或请求正文。

## 10. 分阶段实施

### 阶段 0：冻结现有行为（0.5 天）

- 为 env Cookie 导入、SAPISIDHASH、bootstrap、401/403 和流取消增加 fixture。
- 增加 secret-leak 测试：日志和错误快照中不得出现测试 Cookie value。
- 修正 `.env.example`，不再提供错误 domain 的伪 Cookie；改为说明兼容 JSON 格式。

### 阶段 1：CookieSource 与原子刷新（1 天）

- 实现 `CookieSource`、`EnvCookieSource`、`CookiePolicy`、`SessionManager`。
- `GeminiCookies` 支持从验证完毕的新 Jar 原子替换，而不是先清空活动 Jar。
- 认证错误接入 `ProviderError(authentication)`，AccountPool 支持 `auth_required`。
- 保持现有 CLI 和 API 行为兼容。

### 阶段 2：轻量浏览器认证辅助器 MVP（1.5–2 天）

- 将 `playwright-core` 作为可选依赖接入，禁止自动下载浏览器。
- 实现 Chrome/Edge channel 与 executable path 探测、项目专用 persistent context 和导航约束。
- 实现 Cookie 导出、无头恢复到可见登录的显式切换。
- 实现显式 Chrome Cookie 导入、Profile 选择和临时副本清理。
- 实现登录、状态、刷新、登出及单账户 smoke test。
- 覆盖 macOS/Windows/Linux 的浏览器发现与 Profile 路径测试；CI 无浏览器时使用 `BrowserDriver` fake，不把浏览器二进制加入产物。

### 阶段 3：Responses SSE 稳定性（2 天）

- 实现 Responses SSE 编码器、心跳、终态、取消传播。
- 实现 execution registry 与有界 replay journal。
- 修正 Chat Completions SSE 的 headers、错误终态和取消。
- 生成 `supports_websockets = false` 的 Codex 配置并进行真实 Codex smoke test。

### 阶段 4：按需刷新与多账户（1–2 天）

- 认证失败或接近过期时按需启动浏览器，加入 single-flight 和冷却时间，防止反复弹窗。
- 每账户使用独立 Profile，AccountPool 根据认证状态调度。
- 添加失效、交互验证、账户切换和并发刷新测试。

### 阶段 5：可选桌面 Launcher（后续、非默认）

- 仅当产品需要零依赖浏览器、托盘 UI、常驻 Cookie 事件监听或统一自动更新时，再提供独立 Electron Launcher。
- Electron 放入单独 package/安装选项，不进入核心服务的 dependency，也不改变 `playwright-core` 默认路径。
- Launcher 与核心服务继续通过 `CookieSource` 边界集成，避免认证实现反向污染 AccountPool 和 Transport。

## 11. 测试与验收标准

### 单元测试

- Cookie URL/domain/path/secure/expiry 匹配及必需项缺失。
- Cookie 快照和异常脱敏。
- concurrent refresh single-flight、旧 revision 拒绝、原子 client swap。
- 认证错误不进入普通网络重试；上游临时错误不弹登录窗口。
- SSE sequence、唯一终态、heartbeat、stall timeout、client abort。
- replay journal 重连不重复提交上游。

### 集成测试

- 使用临时 Playwright Profile 和 fake `BrowserDriver` 模拟 signed-out → login → ready → expired → re-login。
- Chrome/Edge 探测、可见登录、无头恢复失败后的显式降级及导航约束。
- 重启服务后从项目专用 Profile 恢复，不读取 `.env` Cookie。
- 代理开启/关闭、网络短断、上游长时间无文本、客户端中途断开。
- 两个账户的 Cookie、日志、会话和请求严格隔离。

### 端到端验收

1. 全新机器不设置 `GEMINI_COOKIES`，通过可见窗口登录后可调用 `/v1/models` 和 `/v1/responses`。
2. 重启服务无需再次粘贴 Cookie；浏览器会话仍有效时不弹窗。
3. 删除/过期 `SAPISID` 后账户进入 `auth_required`，不会无限 401 重试。
4. 120 秒无文本的模拟上游中，Codex 不显示 `Reconnecting`；超过 stall timeout 后收到明确错误。
5. 在流中途断开并用相同 request identity 重连，上游提交次数仍为 1，最终只有一个 `response.completed`。
6. `rg` 扫描日志、测试快照和诊断包，找不到任何测试 Cookie value。
7. `npm test`、`npm run build` 和三平台浏览器发现/Profile smoke 全部通过，发布产物不包含 Chromium 或 Electron 二进制。

## 12. 本次 Codex `Reconnecting` 诊断记录

这次故障与本项目代码无关，是本机 Codex 原生 Responses WebSocket 没有使用 macOS 已配置的系统代理：

- Codex CLI：`0.154.0`，已是诊断时的最新版本。
- 未启用系统代理支持时：HTTPS inference 可达，但 WebSocket 握手在 15 秒后超时。
- 临时启用 `respect_system_proxy` 后：WebSocket 返回 `HTTP 101 Switching Protocols`。
- 已在 `~/.codex/config.toml` 的 `[features]` 中持久设置 `respect_system_proxy = true`，并再次通过 `codex doctor --json` 验证 WebSocket 握手成功。
- 原配置已备份到 `~/.codex/config.toml.bak-20260916-1610`。

OpenAI 官方文档没有给出这条特定实验性开关的稳定承诺，因此它应视为当前 Codex `0.154.0` 的经验证本机修复，而不是本项目要求用户普遍开启的配置。将来 Codex 升级后若该键被移除，应以 `codex doctor` 的网络检查结果和届时官方文档为准。

## 13. 完成定义

满足以下条件才算功能完成：默认安装不要求复制 Cookie；浏览器登录态有明确所有者、隔离目录和登出路径；认证刷新不会污染执行中的请求；Codex Responses SSE 在空闲、取消、失败和重连路径都有确定行为；所有凭据均不出现在日志、配置示例和诊断包中；旧的 `GEMINI_COOKIES` 模式仍可显式启用并有迁移说明。
