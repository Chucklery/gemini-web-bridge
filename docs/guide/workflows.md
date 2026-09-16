# Common workflows

## First run

1. Install Node.js 24+, Chrome or Edge, and dependencies.
2. Copy .env.example to .env and set a local API key.
3. Run npm run auth -- login in the project-owned browser window.
4. Run npm run build and npm start.
5. Smoke-test /health and /v1/models.

## Recover a session

1. Run npm run auth -- status.
2. Run npm run auth -- refresh.
3. If Google requests interactive verification, run npm run auth -- login.
4. Run npm run doctor and check /health.

## Change the code

Run npm run build, npm test, and npm run docs:build. Keep protocol details in the provider layer and update the matching documentation.
