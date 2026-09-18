# CentralDB · CDCI

<p class="blog-kicker">Built with PGPJS</p>

CentralDB is a blockchain for **decentralized data transmission**. The org describes C7 as a way to optimize trust by using a decentralized database instead of a traditional one, so web and mobile apps can stay self-sufficient. CDCI — Central Database Currency infrastructure — is the core chain under that story. It was developed jointly by Erickson Holding LTD and Softywa LTD in 2023.

![CentralDB](../../../assets/img/centraaldb_banner.png)

The public Git repository is [github.com/Centraldb/CDCI](https://github.com/Centraldb/CDCI). The org lives at [github.com/Centraldb](https://github.com/Centraldb).

![CDCI repository banner](../../../assets/blog/centraldb/banner.jpg)

## The chain

CDCI is an **X11** proof-of-work chain with masternodes and ChainLocks. Clients do not recompute X11 themselves. Block hashes and proof of work come from `centraldatabased` over JSON-RPC.

Each sealed payload that needs a public clock is bound to a CDCI transaction that carries a 35-byte `OP_RETURN` commitment. Confirmations and ChainLock status come from the node, not from the application.

| Network   | RPC port | P2P port |
| --------- | -------- | -------- |
| `main`    | 13431    | 13432    |
| `test`    | 23431    | 23432    |
| `regtest` | 19898    | 19899    |

Mainnet genesis hash:

`00000a34128e4769e9ccc6ed6ae234555421b305d62ecb3ce0477a80f4686fb1`

## Where PGPJS sits

CDCI is the settlement layer. **PGPJS is the envelope.**

Before anything is worthy of an anchor, a client seals the payload with `@pgpjs/core` (RFC 9580, Ed25519 / X25519). The chain only ever sees a digest of ciphertext, a size, and opaque routing metadata. If you opened a block on CDCI you would not find a sentence, a filename, or a telemetry sample. You would find a commitment.

That split is the product:

1. **PGPJS** generates keys, seals objects, and opens them only for the holder of the private key.
2. **CDCI** timestamps the _fact_ that a sealed blob existed, with X11 and ChainLocks.

```js
import PGPJS from '@/lib/pgpjs';

const keys = await PGPJS.generateKey({
  name: 'CentralDB node',
  email: 'ops@centraldb.org',
});

const ciphertext = await PGPJS.seal(payload, { to: keys.publicKey });
// Hash ciphertext, then OP_RETURN the commitment on CDCI.
```

## Git

- Repository: [Centraldb/CDCI](https://github.com/Centraldb/CDCI)
- Organization: [github.com/Centraldb](https://github.com/Centraldb)
- PGPJS engine: [@pgpjs/core](/core/)

This page is the PGPJS reading of that Git history: CDCI holds the clock, PGPJS holds the keys.
