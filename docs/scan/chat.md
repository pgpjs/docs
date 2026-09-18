# ChatScan

<p class="blog-kicker">ChatScan · CentralDB daemon</p>

ChatScan is the **accountant** for encrypted records. CentralDB / CDCI is the **database on the chain**. This site runs ChatScan as the backend so PGPJS apps can check the connection and save ciphertext metadata — never message content.

The explorer lives at `/scan/chat`. The SDK is at `/sdk/pgpjs-scan.js`.

<div class="scan-board" data-pgpjs-scan>
  <div class="scan-row">
    <article class="scan-card" data-scan-chatscan>
      <h2>ChatScan</h2>
      <p class="scan-ok" data-scan-chatscan-ok>…</p>
      <p data-scan-chatscan-detail></p>
    </article>
    <article class="scan-card" data-scan-daemon>
      <h2>Daemon</h2>
      <p class="scan-ok" data-scan-daemon-ok>…</p>
      <p data-scan-daemon-detail></p>
    </article>
    <article class="scan-card" data-scan-cdci>
      <h2>CDCI</h2>
      <p class="scan-ok" data-scan-cdci-ok>…</p>
      <p data-scan-cdci-detail></p>
    </article>
  </div>
  <p class="scan-summary" data-scan-summary></p>
  <button type="button" class="install-copy" data-scan-refresh>Check connection</button>
  <h2>Ledger</h2>
  <p>Newest records ChatScan indexed. Each row is a digest, never plaintext.</p>
  <div class="scan-table-wrap">
    <table>
      <thead>
        <tr>
          <th>Ref</th>
          <th>Status</th>
          <th>Protocol</th>
          <th>Size</th>
        </tr>
      </thead>
      <tbody data-scan-records>
        <tr>
          <td colspan="4">Checking the book…</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

## What is running

| Piece        | Role                                                                                                                                                                             |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ChatScan** | Book / explorer. REST at `/api/v1`. Refuses `content`, `body`, `message`, `plaintext`.                                                                                           |
| **Daemon**   | ChatScan local sealer (`pgpjs-local-daemon`) until a public `centraldatabased` is available.                                                                                     |
| **CDCI**     | X11 chain. [github.com/Centraldb/CDCI](https://github.com/Centraldb/CDCI) is not cloneable from here. Set `CHATSCAN_CHAIN_BACKEND=cdci` and `CDCI_RPC_URL` when the node exists. |

Login on this site writes a **hash of the PGP ID** into ChatScan after a successful sign-in. The token itself is never submitted.

## Other PGPJS apps

```js
import { PgpjsScan } from 'https://pgpjs.org/sdk/pgpjs-scan.js';

const scan = await PgpjsScan.connect({ baseUrl: 'https://pgpjs.org' });
const health = await scan.checkConnection();
if (!health.ok) throw new Error('ChatScan connection is not good');

await scan.recordSealed({ ciphertext: sealedBytes, conversation: 'my-app' });
```

Full SDK notes: [Scan SDK](/scan/sdk). Upstream explorer: [crypterchat/chatscan](https://github.com/crypterchat/chatscan).
