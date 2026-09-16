# 流式响应与重连

## 事件管线

Gemini Web 通过 RPC 记录流返回结果。服务先在 Provider 层解析上游记录，再转换为内部事件，最后由目标协议 Route 编码为 SSE：

```text
Gemini chunks → stream parser → text/session/done → downstream SSE
```

内部事件是边界契约：上游私有字段只停留在 Provider；下游客户端不应依赖 Gemini RPC 的原始结构。

## 生命周期处理

实现必须覆盖：

- 正常完成：发送文本终态并关闭流；
- 客户端取消：AbortSignal 传入上游，停止读取并释放账号租约；
- 上游 stall：超过 `GEMINI_STREAM_STALL_TIMEOUT_MS` 后终止；
- 上游错误：headers 已发送时，通过 SSE 终态表达失败；
- 心跳：按 `GEMINI_SSE_HEARTBEAT_MS` 维持下游连接，但不能掩盖上游无进展。

反向代理必须关闭 buffering，并将 read timeout 设置得高于 stall timeout。

## 重放与重试

Responses 使用 replay journal 按 `x-request-id` 记录短 TTL 事件。重连时可重放同一执行已记录的事件；重放绝不能再次提交 Gemini 请求。只有尚未发送内容且确认上游未接受请求时，才允许切换账号或重试。
