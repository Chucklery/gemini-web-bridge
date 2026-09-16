# 流式响应与重连

上游 Gemini 以 RPC/流式记录返回，服务先解析为内部事件，再编码为下游 SSE：

```text
Gemini chunks → GeminiStreamParser → text/session/done/error
                                  → Responses/Chat SSE encoder
```

流式实现必须同时处理四条路径：正常完成、客户端取消、上游 stall、上游错误。发送 headers 后不能再返回普通 Fastify JSON 错误，而应发出可识别的失败终态并关闭流。

## 心跳与重放

心跳维持下游连接，但不替代上游 stall timeout。`x-request-id`（或等价 execution identity）可关联短 TTL、定长事件 journal；重连时重放同一执行的已记录事件，不能再次提交同一 Gemini 请求。

真正的重试只适用于尚未向客户端发送内容、且能证明上游没有接收请求的阶段。一旦产生 session 或文本事件，就不能无条件切换账户重试。
