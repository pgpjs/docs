# PGPJS

> Pretty Good Privacy | JavaScript documentation site generator.

OpenPGP without the complexity — a modern TypeScript toolkit for React, Next.js, and the web.

This site uses the P7 frontend with PGPJS (Docsify) for documentation. Core, Next, and React pages load **live from GitHub**, so repository changes show up here without a rebuild.

## Packages

- [@pgpjs/core](core/) — RFC 9580 engine and high-level `seal` / `open` API
- [@pgpjs/next](next/) — Next.js route handlers, server actions, and `secureRequest`
- [@pgpjs/react](react/) — `PGPProvider` and hooks (`useKey`, `useEncryption`, …)

## Live docs

Markdown and source files are fetched from:

- https://github.com/pgpjs/core
- https://github.com/pgpjs/next (falls back to `core/packages/next` until that repo exists)
- https://github.com/pgpjs/react (falls back to `core/packages/react` until that repo exists)

Use the header search bar to find pages across those docs.
