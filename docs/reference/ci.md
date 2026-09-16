# Testing and release

Before committing, run:

~~~~bash
npm run build
npm test
npm run docs:build
~~~~

The docs workflow builds the VitePress site and publishes the Pages artifact from the main branch. The site uses the /gemini-web-bridge/ base path; set DOCS_BASE to / for a custom domain.

If publishing fails, inspect the Actions build job. A local docs build reproduces Markdown, link, and theme configuration errors.
