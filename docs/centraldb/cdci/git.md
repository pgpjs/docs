# CentralDB · CDCI

<p class="blog-kicker">Built with PGPJS</p>

CentralDB is a blockchain for **decentralized data transmission**. The org describes C7 as a way to optimize trust by using a decentralized database instead of a traditional one, so web and mobile apps can stay self-sufficient. CDCI — Central Database Currency infrastructure — is the core chain under that story. It was developed jointly by Erickson Holding LTD and Softywa LTD in 2023.

The public Git repository is [github.com/Centraldb/CDCI](https://github.com/Centraldb/CDCI). The org lives at [github.com/Centraldb](https://github.com/Centraldb).

![CentralDB banner](../../../assets/blog/centraldb/banner.jpg)

## The chain ChatScan actually talks to

CrypterChat’s explorer does not invent a ledger. It indexes against **CDCI**: an **X11** proof-of-work chain with masternodes and ChainLocks. That description comes straight from ChatScan’s own CDCI notes, which point at this same repository.

Each sealed message is bound to a CDCI transaction that carries a 35-byte `OP_RETURN` commitment. The explorer then reports confirmations and ChainLock status. It never recomputes X11 itself. Block hashes and proof of work come from `centraldatabased` over JSON-RPC.

| Network   | RPC port | P2P port |
| --------- | -------- | -------- |
| `main`    | 13431    | 13432    |
| `test`    | 23431    | 23432    |
| `regtest` | 19898    | 19899    |

Mainnet genesis hash, from those same notes:

`00000a34128e4769e9ccc6ed6ae234555421b305d62ecb3ce0477a80f4686fb1`

## Where PGPJS sits

CDCI is the settlement layer. **PGPJS is the envelope.**

Before anything is worthy of an anchor, a client seals the payload with `@pgpjs/core` (RFC 9580, Ed25519 / X25519). The chain only ever sees a digest of ciphertext, a size, and opaque routing metadata. If you opened a block on CDCI you would not find a sentence, a filename, or a robot telemetry sample. You would find a commitment.

That split is the product:

1. **PGPJS** generates keys, seals objects, and opens them only for the holder of the private key.
2. **CDCI** timestamps the _fact_ that a sealed blob existed, with X11 and ChainLocks.
3. Apps on top — CrypterChat, Prysel Robotics Studio — never have to invent their own OpenPGP stack.

```js
import PGPJS from '@/lib/pgpjs';

const keys = await PGPJS.generateKey({
  name: 'CentralDB node',
  email: 'ops@centraldb.org',
});

const ciphertext = await PGPJS.seal(payload, { to: keys.publicKey });
// Hash ciphertext, then OP_RETURN the commitment on CDCI.
```

## Snapshot from the stack

ChatScan’s dashboard is the public window onto a live CDCI node. The copy on that screen is the same story: an end-to-end encrypted chain, message content never indexed.

![ChatScan dashboard on a CDCI node](../../../assets/blog/crypterchat/dashboard.png)

A single record on that chain shows the anchor transaction, the commitment, and ChainLock state — and no path that could render the message.

![CDCI anchor on a ChatScan record](../../../assets/blog/crypterchat/record-anchor.png)

## Git

- Repository: [Centraldb/CDCI](https://github.com/Centraldb/CDCI)
- Organization: [github.com/Centraldb](https://github.com/Centraldb)
- Related explorer: [crypterchat/chatscan](https://github.com/crypterchat/chatscan)
- PGPJS engine: [@pgpjs/core](/core/)

This page is the PGPJS reading of that Git history: CDCI holds the clock, PGPJS holds the keys.
