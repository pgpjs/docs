# CrypterChat · ChatScan

<p class="blog-kicker">Built with PGPJS</p>

ChatScan is a block explorer for **encrypted messages** instead of coin transfers. That line is from the [ChatScan README](https://github.com/crypterchat/chatscan). Every message sent through CrypterChat is recorded on the chain and addressed as `{HASH}/{ID-number}` — for example `d700bc90…1327a8/42`.

**Message content is never viewable.** CrypterChat encrypts on the client. ChatScan only receives a digest of the ciphertext, its byte length, and opaque routing metadata. The ingest API refuses any request that carries message content, and the explorer has no code path that could render it.

![CrypterChat ChatScan](../../../assets/blog/crypterchat/banner.jpg)

## The story

Most explorers are built to _show_ value moving. ChatScan is built to prove that a sealed message landed, without ever learning what it said.

The chain underneath is **CDCI** — CentralDataBase Core, [github.com/Centraldb/CDCI](https://github.com/Centraldb/CDCI) — an X11 proof-of-work chain with masternodes and ChainLocks. Each message record is bound to a CDCI transaction carrying a 35-byte `OP_RETURN` commitment. The explorer reports confirmations and ChainLock status. See ChatScan’s [docs/CDCI.md](https://github.com/crypterchat/chatscan/blob/main/docs/CDCI.md).

PGPJS is how the client keeps that promise. `@pgpjs/core` seals the body. `@pgpjs/react` can hold the key in a `PGPProvider`. `@pgpjs/next` can keep server routes from ever seeing plaintext. ChatScan then stores only what a public chain is allowed to know.

```js
import { CdciWallet, ChatSession } from '@crypterchat/chatscan-sdk';

const session = await ChatSession.connect({
  baseUrl: 'https://chatscan.org',
  wallet: new CdciWallet({ network: 'main', user: 'rpcuser', password }),
  appVersion: 'pgpjs-chat-1.0',
});

const sent = await session.send('shipping the x11 sealer today', {
  conversation: 'devgroup',
});
// sent.key and sent.envelope stay in your process.
```

`sent.key` and `sent.envelope` stay in the process. The explorer never receives either.

## GitHub snapshot

![crypterchat/chatscan on GitHub](../../../assets/blog/crypterchat/github.png)

Repository: [github.com/crypterchat/chatscan](https://github.com/crypterchat/chatscan) · org: [github.com/crypterchat](https://github.com/crypterchat)

## Screenshots from the explorer

These stills are the project’s own docs media — the dashboard, the record list, one anchored message, a block, and the privacy page.

![The ChatScan dashboard, connected to a CDCI node](../../../assets/blog/crypterchat/dashboard.png)

![Message records addressed as {HASH}/{ID-number}](../../../assets/blog/crypterchat/records.png)

![One record: CDCI anchor, commitment, ChainLock — and no way to read the message](../../../assets/blog/crypterchat/record-anchor.png)

![An X11 block read from the CDCI node](../../../assets/blog/crypterchat/block.png)

![Exactly what is indexed, and everything that is refused](../../../assets/blog/crypterchat/privacy.png)

## Video tour

A 90-second walk through the explorer: live CDCI figures, a message record with its on-chain anchor, a block, and the privacy page. Recorded against a CDCI regtest node. The animated preview in the README runs at 3×; the file below is the real pace.

![Animated tour of ChatScan](../../../assets/blog/crypterchat/chatscan-explorer-preview.webp)

<video class="blog-video" controls preload="metadata" poster="../../../assets/blog/crypterchat/dashboard.png" src="../../../assets/blog/crypterchat/chatscan-explorer-tour.mp4"></video>

## What the explorer shows

| Page                     | What it does                                                                    |
| ------------------------ | ------------------------------------------------------------------------------- |
| `/`                      | Live dashboard: CDCI chain state, fee estimate, unconfirmed records, throughput |
| `/tx/{HASH}/{ID-number}` | One message record: digest, size, protocol, CDCI anchor, status                 |
| `/block/{height}`        | One X11 block and the records anchored in it                                    |
| `/privacy`               | The exact fields ChatScan stores, and everything it refuses                     |

Sending a `content`, `body`, `text`, `message`, `plaintext`, `payload` or `attachment` field fails with HTTP 400 and `"code": "content_rejected"`.

## Git

- [crypterchat/chatscan](https://github.com/crypterchat/chatscan)
- [ChatScan README](https://github.com/crypterchat/chatscan/blob/main/README.md)
- [CDCI notes](https://github.com/crypterchat/chatscan/blob/main/docs/CDCI.md)
- Next in this series: [CentralDB CDCI](/centraldb/cdci/git) · [Prysel Robotics Studio](/prysel/robotics-studio/git)
