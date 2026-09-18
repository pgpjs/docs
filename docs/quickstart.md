# Quick start

Install the PGPJS CLI:

```bash
npm install -g pgpjs-cli
```

Then initialize a project:

```bash
pgpjs init
```

Or add the core library to an existing app:

```bash
npm install @pgpjs/core
npx pgpjs init
```

The CLI detects Next.js, React, Vite, Node, and related layouts, then scaffolds typed integration files.

## Seal and open data

```typescript
import PGPJS from '@/lib/pgpjs';

const keys = await PGPJS.generateKey({
  name: 'Alice',
  email: 'alice@example.com',
});

const ciphertext = await PGPJS.seal(
  { user: 'Bob', balance: 500 },
  { to: keys.publicKey },
);

const data = await PGPJS.open(ciphertext, {
  privateKey: keys.privateKey,
});

console.log(data.balance); // 500
```

## Next.js

See the live [@pgpjs/next](next/) docs for encrypted route handlers.

## React

See the live [@pgpjs/react](react/) docs for hooks and `PGPProvider`.

## This documentation site

```bash
npm install
npm run build
npm run serve
```

Then open [http://127.0.0.1:8080](http://127.0.0.1:8080). Header search is powered by PGPJS/Docsify and indexes Core, Next, and React pages loaded from GitHub.
