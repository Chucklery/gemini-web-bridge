# Streaming and reconnects

Gemini returns RPC records as a stream. The service parses them into internal events and projects those events into downstream SSE.

~~~~text
Gemini chunks → event parser → text/session/done → downstream SSE
~~~~

The implementation must handle normal completion, client cancellation, upstream stalls, and upstream errors. After headers are sent, failures must be represented by a terminal SSE event rather than a JSON error.

Heartbeats keep the downstream connection open but do not replace the upstream stall timeout. Replay journals may replay recorded events for the same execution identity; they must never submit the Gemini request twice.

Retry is safe only before content is sent and only when the upstream request is known not to have been accepted.
