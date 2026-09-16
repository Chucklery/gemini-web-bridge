# Quick start

## Install

```bash
git clone https://github.com/Chucklery/gemini-web-bridge.git
cd gemini-web-bridge
npm install
cp .env.example .env
```

Use Node.js 24 or newer. Browser authentication requires Chrome or Microsoft Edge installed locally; the project never downloads Chromium.

## Configure and sign in

```dotenv
GEMINI_AUTH_MODE=auto
GEMINI_AUTH_PROFILE=default
GEMINI_BROWSER_CHANNEL=auto
HOST=127.0.0.1
PORT=8787
API_KEY=change-this-local-key
```

Run login once:

```bash
npm run auth -- login
```

The command saves a validated auth state. Subsequent service starts are browser-free:

```bash
npm run build
npm start
```

## Check the service

```bash
curl http://127.0.0.1:8787/health
curl -H 'Authorization: Bearer change-this-local-key' http://127.0.0.1:8787/v1/models
```

## Recovery

If Google invalidates the session, run npm run auth -- refresh. This intentionally opens the browser and writes a new state snapshot.
