# 账户池与错误治理

`AccountPool` 通过 balancer 选择账户，`AccountLease` 保证同一账户的请求按序执行。成功会清零连续失败；失败会更新失败计数和冷却时间。认证错误进入 `auth_required`，而一般协议/网络错误进入指数退避冷却。

开发新 Provider 时，不要把所有异常都当成可重试。建议统一错误分类：

| 类型 | 默认动作 |
| --- | --- |
| authentication | 刷新会话；失败则要求登录 |
| rate_limit / quota_exhausted | 冷却账户或等待配额 |
| upstream_unavailable | 有界退避重试 |
| protocol_changed | 失败并告警，不盲目重试 |
| unsupported_feature / invalid_request | 直接返回客户端错误 |
| aborted | 释放资源，不计为账户故障 |

流已经向客户端发送增量后，重试会造成重复内容；因此重试策略必须知道“是否已发出事件”。
