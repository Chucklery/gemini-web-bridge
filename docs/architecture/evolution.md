# Evolution

The long-term goal is to let compatibility protocols and upstream providers evolve independently.

Recommended sequence:

1. Freeze current behavior with RPC, model, stream, cancellation, and error fixtures.
2. Stabilize shared request, event, model, and error contracts.
3. Move model resolution, account selection, calls, and retries into an application service.
4. Separate HTTP schemas, mappers, and response encoders.
5. Generalize account and model registration for additional providers.

Do not abstract unknown private Web RPCs, cookie fields, or session IDs before their contracts are understood.
