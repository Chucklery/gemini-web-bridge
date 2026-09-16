# 演进路线

长期目标是让兼容协议与上游 Provider 独立演进：

```text
OpenAI / Anthropic / Google
             ↓ mapper
      Canonical Generation IR
             ↓
 Gemini Web / ChatGPT Web / Claude Web
```

推荐按阶段推进：

1. 冻结当前行为：补齐 RPC、模型、流式、取消和错误 fixture。
2. 引入 `core` 请求、事件、模型和错误契约，用 Gemini 包装现有实现。
3. 让统一 `GenerationService` 承担模型解析、调度和重试，路由不再直接接触 `AccountPool`。
4. 拆分各 HTTP 协议的 schema、mapper 与 encoder。
5. 泛化账户池的 Provider、并发容量、冷却和模型注册。

不要提前抽象未知 Provider 的私有 Web RPC、Cookie 字段或会话 ID；先稳定 `ProviderClient`、`GenerationRequest`、`GenerationEvent`、`ProviderError` 和 `ModelRegistry` 边界。
