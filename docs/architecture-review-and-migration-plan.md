# Gemini Web Bridge：代码结构审查与演进方案

## 1. 审查范围与结论

本审查聚焦代码结构、模块边界和 Provider 可演进性，不涉及具体 Gemini Web 协议字段的正确性验证。

当前项目可以构建并运行，现有测试也已通过；但整体仍是“Gemini Web 原型 + 多协议 HTTP 外壳”。入站 API 协议（OpenAI、Anthropic、Google）与上游 Web Provider（Gemini）没有分离。若直接加入 ChatGPT Web 或 Claude Web，路由、账户池、重试、流式响应和请求转换会发生重复实现。

目标应是：保持现有 Gemini 功能可用，同时建立稳定的内部生成模型，使 HTTP 兼容层与 Provider 实现可以独立演进。

## 2. 当前结构

```text
HTTP routes
  └─ AccountPool
       └─ Account
            └─ GeminiClient
                 └─ GeminiTransport / Gemini RPC
```

目前 `Account.client` 固定为 `GeminiClient`，账户池还直接暴露 `GeminiModel`。OpenAI、Anthropic、Google adapters 虽然存在，但并未成为路由的统一调用入口；各路由仍自行拼接 prompt 并调用 Gemini 客户端。

## 3. 需要优先处理的问题

### 3.1 Provider 与账户池强耦合

`Account`、`AccountPool`、`AccountBalancer` 和共享生成函数都依赖 Gemini 类型。这使得 Claude 或 ChatGPT 只能通过复制一套账户池，或伪装成 Gemini 客户端接入。

应将账户池依赖改为通用 `ProviderClient`，账户只保留 Provider 标识、客户端和运行时健康状态。Provider 专属认证、会话和协议细节留在 `providers/<id>` 内。

### 3.2 API 兼容层与上游 Provider 混淆

当前 adapters 的命名容易误导：`OpenAIAdapter` 实际是“OpenAI 请求转 Gemini prompt”，不是 ChatGPT Web 客户端。建议将其迁移到 `interfaces/http/openai`，并把上游实现统一放入 `providers/gemini`、`providers/chatgpt`、`providers/claude`。

目标关系如下：

```text
OpenAI API ─┐
Anthropic API ├─ Request Mapper ─ Canonical Generation IR ─ Provider Client
Google API ──┘                                      ├─ Gemini Web
                                                   ├─ ChatGPT Web（预留）
                                                   └─ Claude Web（预留）
```

### 3.3 公共请求模型丢失语义

当前消息最终被拼成字符串，无法可靠表达 system/developer 消息、多模态内容、工具调用、结构化输出、reasoning、引用和 usage。

应建立与厂商无关的内部请求模型：消息角色、文本/图片/文件/tool call 等内容块、工具定义、生成参数、响应格式和 Provider 扩展字段均独立建模。各 HTTP 协议只负责外部格式与内部模型之间的映射。

### 3.4 流式事件没有成为跨 Provider 契约

Gemini 事件类型定义在 `gemini/client.ts`，包含 Gemini 专属的 `phase` 和 `session`。未来 Provider 不能直接复用，也无法让不同 HTTP 协议共享一套流式处理器。

应将事件提升到核心层，至少包含 `message_start`、`text_delta`、`reasoning_delta`、`tool_call_delta`、`citation`、`usage` 和 `completed`。Provider 特有信息使用 `provider_metadata` 承载。

### 3.5 账户调度与并发模型不清晰

当前请求先选账户、完成后才更新 `lastUsedAt`，多个并发请求可能全部选中同一账户并排队。所有账户还被统一串行化，无法表达某些 Provider 支持多并发而 Gemini 会话需要单并发的差异。

账户运行时应增加 `inFlight`、`maxConcurrency`、冷却原因和禁用原因；选择账户时立即预留并发槽位。串行限制应是 Provider 能力，而不是账户池的固定规则。

### 3.6 重试没有错误分类

当前所有异常都增加失败计数并冷却账户。认证失效、限流、协议变更、用户取消、输入不支持和网络暂时故障的处理方式并不相同；流式响应已经发送部分内容后也不能无条件切换账户重试。

应建立统一 `ProviderError`，至少区分 `authentication`、`rate_limit`、`quota_exhausted`、`upstream_unavailable`、`protocol_changed`、`unsupported_feature`、`invalid_request` 和 `aborted`，并附带 `retryable` 与账户动作（无动作、冷却、禁用、刷新）。重试策略只对“尚未向客户端发送内容”的请求生效。

## 4. 目标目录

```text
src/
  core/
    generation.ts       # Canonical GenerationRequest
    events.ts           # Canonical GenerationEvent
    provider.ts         # ProviderClient / ProviderCapabilities
    errors.ts
    model-registry.ts
  application/
    generation-service.ts
    account-pool.ts
    retry-policy.ts
  providers/
    gemini/
      client.ts
      protocol/
      auth/
      factory.ts
    chatgpt/
      client.ts          # 预留，不提前实现私有协议
      protocol/
      auth/
    claude/
      client.ts          # 预留，不提前实现私有协议
      protocol/
      auth/
  interfaces/http/
    openai/
      schemas.ts
      request-mapper.ts
      response-mapper.ts
      routes.ts
    anthropic/
    google/
  infrastructure/
    transport/
    config/
  bootstrap/
    container.ts
```

## 5. 建议的核心接口

```ts
type ProviderId = 'gemini-web' | 'chatgpt-web' | 'claude-web';

interface ProviderClient {
  readonly provider: ProviderId;
  readonly capabilities: ProviderCapabilities;
  listModels(signal?: AbortSignal): Promise<ModelInfo[]>;
  generate(request: GenerationRequest, signal?: AbortSignal): AsyncIterable<GenerationEvent>;
  refresh?(): Promise<void>;
  close?(): Promise<void>;
}

interface ProviderAccount {
  id: string;
  provider: ProviderId;
  client: ProviderClient;
  health: AccountHealth;
}
```

`GenerationRequest` 应包含标准化消息、模型选择、工具、响应格式、生成参数和 `providerOptions`。`GenerationEvent` 应成为所有 Provider 与所有 HTTP 输出编码器之间的唯一流式契约。

## 6. 分阶段迁移

### 阶段 0：冻结行为

- 保留当前 API 路径和响应格式。
- 为 Gemini RPC、模型目录、流式增量、取消和错误建立 fixture 测试。
- 将路由测试从“允许多个状态码”改为验证具体响应结构。

### 阶段 1：引入核心契约

- 新增 `core` 请求、事件、模型和错误类型。
- 用 `GeminiProviderClient` 包装现有 `GeminiClient`。
- 保持现有 Gemini RPC、cookie 和 transport 代码不变。

### 阶段 2：统一应用服务

- 新增 `GenerationService`，负责模型解析、账户选择、调用、错误分类和重试。
- routes 不再接触 `AccountPool` 或 `GeminiClient`，只调用应用服务。
- 统一非流式与流式路径，非流式通过收集事件生成最终结果。

### 阶段 3：拆分 HTTP 兼容层

- 将 OpenAI、Anthropic、Google 的 schema、mapper、response encoder 分开。
- 删除未使用或命名误导的旧 adapters，或将其正式迁移到对应 HTTP 目录。
- 增加模型别名和 Provider 路由策略。

### 阶段 4：泛化账户与模型注册

- 账户池按 Provider 管理，并支持并发容量、冷却、禁用和健康探测。
- 引入 `ModelRegistry`，模型内部标识建议使用 `provider/model`，公开别名单独配置。
- CLI 和配置支持多个 Provider、多个账户及账户级代理。

### 阶段 5：预留 ChatGPT / Claude Web

- 创建空的 `providers/chatgpt` 和 `providers/claude` 模块，只实现接口、能力声明和契约测试。
- 不在核心层假设它们的 cookie、WebSocket、SSE、会话或私有 RPC 细节。
- Provider 特有字段统一放入 `providerOptions` 与 `provider_metadata`，避免污染通用模型。

## 7. 配套工程改进

- 将构建配置拆为 `tsconfig.build.json` 和 `tsconfig.test.json`，避免发布测试文件。
- 增加 ESLint、Prettier、未使用导入检查和依赖边界检查。
- 为 routes、Provider、账户调度和流式 encoder 分别建立单元与契约测试。
- 接入 CI：安装、类型检查、测试、构建和覆盖率门槛。
- 将超时、AbortSignal、Fastify 生命周期和 transport `close()` 接入同一依赖注入容器。
- 发布前补齐 LICENSE、贡献指南、行为准则、安全报告入口和完整配置说明。

## 8. 不应提前抽象的部分

ChatGPT Web 与 Claude Web 的私有协议尚未确定，不应提前设计统一的“Web RPC 基类”、统一 cookie 字段或统一会话 ID。只需要稳定以下边界：

```text
ProviderClient
GenerationRequest
GenerationEvent
ProviderError
ModelRegistry
```

这既为后续 Provider 留出明确缺口，也避免核心层被 Gemini 当前实现反向绑死。
