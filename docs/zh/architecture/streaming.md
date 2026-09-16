# 流式响应与重连

Gemini 以 RPC 记录流返回结果，服务先解析为内部事件，再编码为下游 SSE。

~~~~text
Gemini chunks → event parser → text/session/done → downstream SSE
~~~~

实现必须处理正常完成、客户端取消、上游 stall 和上游错误。发送 headers 后，失败应通过终态 SSE 事件表示，而不是返回 JSON 错误。

心跳只能维持下游连接，不能替代上游 stall timeout。重放 journal 可以重放同一执行的已记录事件，但不能再次提交 Gemini 请求。

只有在尚未发送内容且确认上游没有接收请求时才允许重试。
