# Accounts and error handling

The account pool selects healthy accounts, serializes work for Gemini sessions, tracks failures, and applies cooldowns.

Errors should remain distinguishable: authentication, rate limit, quota exhausted, upstream unavailable, protocol changed, unsupported feature, invalid request, and aborted.

A request may retry before downstream content is sent. After a session or text event has been emitted, it must not switch accounts automatically.
