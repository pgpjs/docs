# PGPJS Scan SDK

<p class="blog-kicker">ChatScan SDK for PGPJS apps</p>

Use this from any app that seals with PGPJS. ChatScan stores **ciphertext metadata only**. Connection check tells you if ChatScan, the daemon, and CDCI are good.

## Install

ESM from this site (no npm install required):

```js
import { PgpjsScan } from 'https://pgpjs.org/sdk/pgpjs-scan.js';
```

Or vendor `docs/sdk/` from [github.com/pgpjs/docs](https://github.com/pgpjs/docs). The ChatScan client under `/sdk/chatscan/` is the upstream [crypterchat/chatscan SDK](https://github.com/crypterchat/chatscan/tree/main/sdk).

## Check connection

```js
const scan = new PgpjsScan({ baseUrl: 'https://pgpjs.org' });
const health = await scan.checkConnection();

health.ok; // true when ChatScan and the daemon answer
health.chatscan.status; // "online"
health.daemon.name; // "pgpjs-local-daemon" or "centraldatabased"
health.cdci.ok; // true only when a CDCI node is configured
```

`GET /api/v1/connection` is the same payload. CORS is open so other origins can call it.

## Record a sealed payload

Seal with `@pgpjs/core` (or any client crypto). Send the digest, not the plaintext:

```js
import PGPJS from '@pgpjs/core';
import { PgpjsScan } from 'https://pgpjs.org/sdk/pgpjs-scan.js';

const keys = await PGPJS.generateKey({ name: 'app', email: 'app@example.com' });
const ciphertext = await PGPJS.seal(payload, { to: keys.publicKey });
const bytes = new TextEncoder().encode(ciphertext);

const scan = await PgpjsScan.connect({ appVersion: 'my-app-1.0' });
const recorded = await scan.recordSealed({
  ciphertext: bytes,
  conversation: 'orders',
});
// recorded.ref → {HASH}/{ID-number}
```

Sending `content`, `body`, `text`, `message`, or `plaintext` fails with `content_rejected`.

## Login ledger

```js
await scan.recordLogin({ pgpid });
```

That hashes `pgpjs-login:{pgpid}` and submits the hash. The PGP ID and Code ID never hit ChatScan.

## REST underneath

| Method | Path                 | Purpose                         |
| ------ | -------------------- | ------------------------------- |
| GET    | `/api/v1/connection` | ChatScan + daemon + CDCI health |
| GET    | `/api/v1/status`     | Explorer snapshot               |
| GET    | `/api/v1/chain`      | Daemon / chain height           |
| POST   | `/api/v1/records`    | Index ciphertext metadata       |
| GET    | `/api/v1/records`    | Ledger (the book)               |

Explorer UI: [/scan/chat](/scan/chat).
