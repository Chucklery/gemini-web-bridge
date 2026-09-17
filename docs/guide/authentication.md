# Authentication

## Browser setup and recovery

With `GEMINI_AUTH_MODE=auto` or `browser`, run:

```bash
npm run auth -- login       # first setup or interactive re-login
npm run auth -- status      # status only; never prints cookie values
npm run auth -- refresh     # explicit browser-based recovery
npm run auth -- logout      # remove the project-owned auth profile
```

The login command opens an isolated Chrome/Edge profile. The user completes Google sign-in; the application never fills passwords, verification codes, or passkeys and never takes over the daily browser profile. The validated cookies are saved to `gemini-auth-state.json`.

If Google blocks the isolated window with “Try using a different browser,” sign in to Gemini in the normal Chrome profile and run this explicit one-time import:

```bash
npm run auth -- import-chrome
```

The command reads a temporary copy of Chrome's Cookie database, exports only Google/Gemini cookies, and saves the project-owned auth state. When more than one local Chrome profile is detected, `GEMINI_CHROME_PROFILE_NAME` is required.

## Browser-free service runtime

After setup, `npm start` reads the saved state file. Bootstrap, model discovery, generation, and streaming use the Node HTTP transport. No browser process and no Gemini frontend JavaScript are required during normal operation.

If the state is missing or invalid, startup enters the explicit browser recovery path. If the browser is unavailable, the service fails closed instead of sending anonymous requests.

## Environment Cookie compatibility mode

Use this mode only as a rescue path on machines without a supported browser:

```dotenv
GEMINI_AUTH_MODE=env
GEMINI_COOKIES='[{"name":"SID","value":"...","domain":".google.com","path":"/"}]'
```

Use real `domain`, `path`, `secure`, `httpOnly`, and expiry attributes from the source browser. Placeholder cookies are not valid credentials.

## Security boundary

- Cookies and `gemini-auth-state.json` are complete login credentials.
- Do not commit `.env`, profiles, diagnostics, request bodies, API keys, or cookies.
- Do not expose the service directly to the Internet.
- Authentication failures are fail-closed and never become anonymous requests.
