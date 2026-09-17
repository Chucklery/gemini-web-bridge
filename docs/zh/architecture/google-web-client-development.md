# Google Gemini Web Provider 开发文档

本文档说明如何参考 [`qutek/gemini-web-api`](https://github.com/qutek/gemini-web-api/tree/main/packages/gemini-webapi) 的 Google Gemini Web 实现，继续完善本项目的 Gemini Web Provider。文档针对当前仓库的分层设计编写，不把参考项目的代码或实现细节直接复制进来。

> Gemini Web 使用的是 Google Gemini 网页端的私有接口，不是官方 Gemini API。页面结构、RPC 名称、数组下标、模型标识、Cookie 生命周期和访问策略都可能变化。所有实现都应保留可替换边界，并通过脱敏的契约测试验证。

## 1. 目标与边界

目标是让本项目稳定完成以下链路：

```text
兼容 API 请求
  → Adapter / Route
  → AccountPool
  → GeminiClient
  → Gemini Web bootstrap
  → StreamGenerate RPC
  → 内部 GeminiEvent
  → OpenAI / Anthropic / Google 响应
```

参考项目主要提供了四类值得吸收的能力：

| 能力 | 参考实现的做法 | 本项目的落点 |
| --- | --- | --- |
| 会话初始化 | GET `/app`，提取 `SNlM0e`、build label、session id、语言和 push id | `src/gemini/client.ts`、`src/gemini/models.ts` |
| Cookie 延续 | 以 `__Secure-1PSID` 作为账号主键，合并缓存 Cookie，并调用 `RotateCookies` | `src/auth/`、`SessionManager`；轮换能力待补强 |
| 多轮对话 | 保存 `[cid, rid, rcid]`，每次响应更新 metadata | `ConversationSnapshot`、`src/gemini/session.ts` |
| RPC 与流解析 | 固定位置数组、长度前缀/NDJSON、增量文本和候选资源解析 | `src/gemini/request-builder.ts`、`rpc.ts`、`stream-parser.ts` |

不在本阶段范围内的内容：官方 API Key、绕过 Google 风控、读取用户日常浏览器 Profile、密码或验证码自动化，以及在未验证上游已接受请求时的重复提交。

## 2. 认证与 Cookie 生命周期

### 2.1 初始化

参考项目以 `__Secure-1PSID` 为必需 Cookie，并把 `__Secure-1PSIDTS` 作为推荐 Cookie。初始化时：

1. 读取基础 Cookie。
2. 按 `sha256(__Secure-1PSID).slice(0, 16)` 定位本地缓存。
3. 将基础 Cookie 与缓存 Cookie 合并，缓存值覆盖同名旧值。
4. 请求 `https://gemini.google.com/app`。
5. 从 HTML 提取动态参数：
   - `SNlM0e`：后续 RPC 的 `at` 参数；
   - `cfb2h` 或 `bl`：构建版本标签；
   - `FdrFJe`：`f.sid` 会话标识；
   - `TuX5cc`：语言；
   - `qKIAYe`：文件上传所需的 push id。
6. 合并响应的 `Set-Cookie` 并持久化。

本项目已经有浏览器登录、CookieJar、文件 Cookie 源和 `SessionManager`。实现时应将网页 HTML 解析限制在 Provider bootstrap 层，不能让 Route 或 Adapter 直接读取 Cookie。

### 2.2 Cookie 轮换

参考实现定时 POST：

```text
https://accounts.google.com/RotateCookies
Content-Type: application/json
Origin: https://accounts.google.com
Cookie: <完整 Cookie 串>
Body: [000,"-0000000000000000000"]
```

响应成功后读取所有 `Set-Cookie`，更新 CookieJar 和缓存。建议本项目按以下规则实现：

- 轮换属于账号会话服务，不属于 `GeminiClient.generate()`；
- 同一账号只允许一个轮换任务运行；
- 轮换失败只记录可观测的原因分类，不输出 Cookie 值；
- 轮换成功后原子更新认证状态，避免请求读到半套 Cookie；
- 账号被判定为未认证时，先使当前 revision 失效，再由 `SessionManager` 单飞刷新；
- 缓存文件权限继续保持目录 `0700`、文件 `0600`，且不进入 Git、日志、错误响应或 replay journal。

## 3. 会话模型

Gemini Web 的多轮会话不是简单地把历史消息重新拼接到 prompt，而是依赖上游返回的三个标识：

```text
[cid, rid, rcid]
```

- `cid`：会话 ID；
- `rid`：当前请求/响应关联 ID；
- `rcid`：当前候选响应 ID。

新会话使用空值三元组。每次响应解析到新的 candidate 时，必须更新 `rcid`；解析到上游 session metadata 时，更新 `cid` 和 `rid`。更新应当是部分更新，不能因为某个响应分片缺字段而清空已有值。

推荐的职责划分：

| 对象 | 职责 |
| --- | --- |
| `ConversationSnapshot` | 仅表示可序列化的三元组 |
| `GeminiSession` | 保存快照、串行化同一会话的请求、暴露更新操作 |
| `GeminiClient` | 使用快照构造请求并发出内部事件 |
| Adapter | 将外部请求的会话语义转换为一次或持续的内部生成调用 |

同一会话不能并行提交两个生成请求，否则后一个请求可能覆盖前一个请求的 `rid/rcid`。账号级串行租约仍然必须保留，因为不同会话也可能共享同一 Google 账号的上游限额。

## 4. 请求构造

### 4.1 上游端点

当前已知端点：

```text
GET  https://gemini.google.com/app
POST https://gemini.google.com/_/BardChatUi/data/batchexecute
POST https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate
POST https://content-push.googleapis.com/upload
POST https://accounts.google.com/RotateCookies
```

所有端点、RPC ID、请求头和动态字段应集中在 Provider 代码中，避免散落在路由和适配器里。

### 4.2 StreamGenerate 请求

请求使用 `application/x-www-form-urlencoded`，核心字段为：

```text
at=<SNlM0e>&f.req=[null,"<JSON.stringify(innerRequest)>"]
```

`innerRequest` 是一个位置敏感的数组。参考实现使用长度为 69 的数组，本项目当前使用长度为 97 的兼容布局；这两个值不是业务字段数量，不能用对象替代，也不能随意压缩空位。开发时必须：

- 用命名常量记录关键下标；
- 为 payload builder 写固定快照测试；
- 将模型、语言、会话、临时会话、Deep Research、附件等可选能力分别封装；
- 每次生成使用新的 request UUID；
- `_reqid` 使用单调递增或随机起始的请求序列，避免同一客户端重复；
- 请求取消时沿 `AbortSignal` 终止传输，并释放账号租约。

基础字段的语义映射如下：

| 语义 | 参考实现 | 当前项目 |
| --- | --- | --- |
| prompt | `innerReqList[0]` | `payload[0]` |
| language | `[1]` | `[1]` |
| conversation metadata | `[2]` | `[2]` |
| streaming | `[7] = 1` | `[7] = 1` |
| request UUID | `[59]` | `[59]` |
| model mode | 模型配置/请求头 | `payload[79]` |
| temporary chat | 参考项目 `[45]` | 待补充到 builder 选项 |
| attachments | `[0][3]` | 待补充 |

请求头至少应包含 `Origin`、`Referer`、`X-Same-Domain` 和 `Content-Type`。模型相关的 `x-goog-ext-*-jspb` 头是上游私有字段，应由模型配置生成，不能由外部客户端任意透传。

### 4.3 模型发现与模型映射

启动时通过 `batchexecute` 的 `otAQ7b` 获取模型目录是比硬编码模型名更稳妥的基础方案。模型目录应缓存于 bootstrap 生命周期内，并在以下情况下重新获取：

- 首次请求；
- 上游返回模型不可用；
- build label 变化；
- 认证 session 被替换。

外部模型名到上游模式的映射必须有明确的 fallback 策略。未知模型可以回退到默认模型，但要记录 `model_fallback` 指标；不能把任意模型字符串直接拼入私有请求头。

## 5. 响应与流解析

### 5.1 分帧

参考实现同时处理三种形态：

1. 长度前缀帧：`<length>\n<JSON>`；
2. 直接 JSON；
3. NDJSON。

解析器必须保留未完成尾帧，等待下一次 chunk；不能把一次网络 chunk 当作一次完整 JSON。解析前应去除 `)]}'` 防劫持前缀，解析失败的单帧不能破坏已成功解析的前帧，但最终没有任何有效记录时应抛出可重试的协议错误。

### 5.2 内部事件

Provider 输出统一的 `GeminiEvent`：

```text
text    文本或文本快照
thought 思考过程（若上游提供且产品允许暴露）
phase   阶段信息
session cid/rid/rcid 更新
done    明确结束
error   上游错误
```

参考项目的 `ModelOutput` 还会解析网页搜索图片、生成图片、视频、媒体和 Deep Research 计划。本项目当前只承诺文本和会话事件；新增资源时应先扩展内部事件契约，再由各协议 Adapter 决定是否支持，不能在 Google Route 中直接解析私有数组。

### 5.3 增量文本

Gemini Web 某些分片返回的是“截至当前的完整文本”，而不是严格 delta。应保存上一版已发送文本：

1. 新文本以已发送文本为前缀时，发送新增后缀；
2. 发生重排时，在最近一段文本中寻找重叠位置；
3. 找不到可靠重叠时发送完整新文本，并标记为 parser recovery；
4. 结束帧使用最终原文，避免清理 Markdown 代码围栏造成内容丢失。

下游流必须只产生一个 terminal 状态。上游错误、超时、客户端取消和正常完成都要经过统一的 `done/error` 收尾逻辑。

## 6. 文件上传与多模态

参考项目先把文件上传到 `content-push.googleapis.com/upload`，再把返回 URL 和文件名放入 `innerRequest[0][3]`。实现上传时：

- 只接受明确的本地文件或内存 Buffer 输入；
- 限制大小、MIME、数量和总请求预算；
- 使用 bootstrap 提取到的 push id；
- 上传请求继承 Cookie、代理、取消信号和超时策略；
- 不把文件内容写入日志或 replay journal；
- 上传成功但生成失败时，不自动重复上传，除非有明确的幂等标识和状态判断。

本项目的 Google `generateContent` 当前把 `contents` 简化为文本输入。后续可按“Google Content → 内部 multimodal prompt → Gemini upload/reference”扩展，而不是让 Route 直接构造上游数组。

## 7. 与当前代码的实施计划

### 阶段 A：稳固现有文本链路

- 补全 `GoogleAdapter` 对 `contents[].parts[]`、system instruction 和多轮内容的转换；
- 让 `generateContent` 返回真实的 token/finish reason 映射；
- 完善模型目录到 `/v1/models` 和 Google 模型参数的映射；
- 为 bootstrap、payload、错误和 parser 增加固定样本测试。

### 阶段 B：认证状态与 Cookie 轮换

- 在 `SessionManager` 之上加入账号级 cookie rotation service；
- 捕获并合并响应 `Set-Cookie`；
- 对缓存读写增加原子性、版本和过期校验；
- 验证轮换与正在执行的生成请求之间的 revision 行为。

### 阶段 C：会话与流式一致性

- 将 `ConversationSnapshot` 与 `GeminiSession` 的更新规则集中化；
- 增加同一会话串行测试和取消测试；
- 将 Google 非流式响应与 SSE 响应都建立在同一内部事件序列上；
- 增加重复文本、重排文本、空帧、半帧和错误帧样本。

### 阶段 D：附件和资源输出

- 增加 upload transport 与安全预算；
- 扩展内部事件的图片、视频、媒体和引用字段；
- 在 OpenAI、Anthropic、Google 三种协议中分别声明支持矩阵；
- 对不支持的能力返回明确的兼容错误，而不是静默丢弃。

## 8. 测试与可观测性要求

每个私有协议字段都应至少有以下测试：

- bootstrap 成功、缺字段、登录页和非 200；
- Cookie 合并、轮换、失效、并发刷新；
- payload 关键下标和 headers 快照；
- 长度前缀半帧、粘包、NDJSON 和防劫持前缀；
- 文本快照到 delta 的重复与重排；
- session metadata 的部分更新；
- 上游超时、取消、429/5xx、认证失败和解析失败；
- 生成请求在下游已发送内容后的不可重试约束。

建议记录但不包含敏感内容的指标：`bootstrap_latency`、`model_catalog_failure`、`cookie_rotation_result`、`upstream_status`、`parser_recovery`、`stream_stall`、`account_cooldown` 和 `request_terminal_state`。日志只允许记录账号内部 ID、revision 摘要和错误分类，禁止记录 Cookie、完整请求体、prompt、上传内容和 API Key。

## 9. 参考实现与变更记录

本设计参考：

- [`qutek/gemini-web-api/packages/gemini-webapi`](https://github.com/qutek/gemini-web-api/tree/main/packages/gemini-webapi)
- [`client.ts`](https://github.com/qutek/gemini-web-api/blob/main/packages/gemini-webapi/src/client.ts)
- [`get-access-token.ts`](https://github.com/qutek/gemini-web-api/blob/main/packages/gemini-webapi/src/utils/get-access-token.ts)
- [`parsing.ts`](https://github.com/qutek/gemini-web-api/blob/main/packages/gemini-webapi/src/utils/parsing.ts)
- [`constants.ts`](https://github.com/qutek/gemini-web-api/blob/main/packages/gemini-webapi/src/constants.ts)

参考仓库的默认分支会持续变化。每次升级 Gemini Web Provider 时，应记录抓取日期、上游 commit、受影响的 RPC/数组字段、兼容性验证结果和回滚方式。
