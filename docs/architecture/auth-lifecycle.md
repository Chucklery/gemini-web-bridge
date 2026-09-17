# Authentication and Cookie lifecycle

The browser owns the durable login session. The service owns only a validated, local auth-state snapshot:

```text
Browser setup/recovery → CookiePolicy → gemini-auth-state.json
                                      ↓
                         FileCookieSource → CookieJar → HTTP transport
```

After `auth login` succeeds, the state is saved under the account's isolated profile directory. On normal startup, `BrowserCookieSource.current()` first loads this file; it does not launch a browser. The Gemini client then performs bootstrap, model discovery, and generation using HTTP requests only.

The browser is opened only when the state file is missing or expired, when the user runs `npm run auth -- refresh`, or when authentication recovery is explicitly required. A successful recovery atomically replaces the state file and the in-memory CookieJar.

`SessionManager` provides single-flight refresh behavior. Concurrent requests share one refresh, and an active request keeps its current client while a replacement session is validated. Authentication failures never silently downgrade to anonymous requests.

## State file

The file is `gemini-auth-state.json` inside the hashed account profile directory. It contains only the validated Gemini cookie snapshot, uses owner-only permissions (`0700` directory, `0600` file), and is written through a temporary file followed by rename. Treat it as a login credential: do not commit, log, copy, or upload it.

## Daily browser profile import is explicit only

Normal startup never reads a daily browser database, attaches to an existing browser, or exposes a CDP port. When Google blocks automated login, the explicit `npm run auth -- import-chrome` command can read a temporary copy of Chrome's Cookie database, filter it to Google/Gemini cookies, and save the result to the project-owned state. This keeps import separate from runtime authentication and avoids taking over the user's live browser.
