# 演进路线

长期目标是让兼容协议与上游 Provider 独立演进。

建议按以下阶段推进：

1. 通过 RPC、模型、流式、取消和错误 fixture 固定当前行为。
2. 稳定通用的请求、事件、模型和错误契约。
3. 将模型解析、账户选择、调用和重试移入应用服务。
4. 拆分 HTTP schema、mapper 和 response encoder。
5. 为更多 Provider 泛化账户与模型注册。

在明确协议之前，不要抽象未知的私有 Web RPC、Cookie 字段或会话 ID。
