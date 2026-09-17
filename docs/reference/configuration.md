# Configuration

| Variable | Default | Description |
| --- | --- | --- |
| HOST | 127.0.0.1 | Listen address |
| PORT | 8787 | Listen port |
| API_KEY | empty | Protect compatible API routes when non-empty |
| GEMINI_AUTH_MODE | auto | auto/browser use the isolated auth profile; env uses compatibility Cookie mode |
| GEMINI_COOKIES | empty | JSON cookie array for explicit env mode |
| GEMINI_AUTH_PROFILE | default | Account identifier used to derive the isolated profile path |
| GEMINI_AUTH_TIMEOUT_MS | 120000 | Browser setup/recovery timeout |
| GEMINI_BROWSER_CHANNEL | auto | auto, chrome, or msedge |
| GEMINI_BROWSER_EXECUTABLE_PATH | empty | Browser path override |
| GEMINI_CHROME_USER_DATA_DIR | empty | Chrome User Data root used only by `auth import-chrome`; auto-discovered when empty |
| GEMINI_CHROME_PROFILE_NAME | empty | Chrome profile directory used only by `auth import-chrome`, e.g. `Default` or `Profile 2` |
| GEMINI_BROWSER_HEADLESS_RECOVERY | false | Allow a headless recovery attempt before showing a window; Google sign-in may reject it |
| GEMINI_AUTH_DATA_DIR | empty | Root directory for the isolated profile and auth state |
| GEMINI_PROXY | empty | HTTP/HTTPS proxy |
| GEMINI_SSE_HEARTBEAT_MS | 2000 | SSE heartbeat interval |
| GEMINI_STREAM_STALL_TIMEOUT_MS | 120000 | Maximum upstream stall time |
| GEMINI_REPLAY_TTL_MS | 900000 | Event replay TTL |

The default auth state path is:

```text
~/.gemini-web-bridge/browser-profiles/<hashed-account-id>/gemini-auth-state.json
```

Keep this directory outside the repository and treat it as a credential store.
