# PGPJS CLI in Prysel Robotics Studio

<p class="blog-kicker">Built with PGPJS · CLI</p>

Prysel Robotics Studio is the robotics workbench from [CerveauAnalytique](https://github.com/CerveauAnalytique). The Git repository is [Prysel.Robotics-Studio-](https://github.com/CerveauAnalytique/Prysel.Robotics-Studio-.git). This page is how that studio **installs and runs the PGPJS CLI** — the same `pgpjs` binary the Windows and macOS download cards use, pointed at robots instead of a web form.

![PGPJS CLI on Prysel Robotics Studio](../../../assets/img/prs.png)

The studio already signs this documentation site. The footer of pgpjs.org is a Prysel mark. Putting the CLI on the bench is not a demo bolted on later. It is how operators generate RFC 9580 keys, seal telemetry, and init a TypeScript project without leaving the workbench.

![Prysel](../../../assets/blog/prysel/banner.png)

## Install the CLI on the bench

Prysel Robotics Studio talks to a normal Node toolchain. On the operator laptop (macOS or Windows) inside the studio session:

```bash
npm install -g pgpjs-cli
pgpjs --help
```

<button type="button" class="install-copy" data-copy="npm install -g pgpjs-cli">Copy</button>

That is the same install as the [Windows](/cli/windows) and [macOS](/cli/macos) download pages. Node.js **20.10** or newer. The splash screen below is the real CLI from [pgpjs/cli](https://github.com/pgpjs/cli).

![pgpjs splash screen](../../../assets/blog/cli/pgpjs-splash.png)

In the studio repo:

```bash
cd Prysel.Robotics-Studio-
pgpjs init
pgpjs install node
pgpjs doctor
```

`pgpjs init` detects the layout, scaffolds typed integration files, and gitignores `.pgpjs/`. Private keys never belong in a robot image or a CI log.

![pgpjs key --help](../../../assets/blog/cli/pgpjs-key-help.png)

## What the CLI is doing in the studio

A robotics studio is a factory for identities. Every arm, every operator laptop, every firmware bundle needs a name that can be proven later. The CLI is the terminal face of that:

1. **Pair** a robot with `pgpjs key generate` — Ed25519 for signatures, X25519 for sealing.
2. **Seal** a telemetry frame or a mission file with `pgpjs encrypt` before it leaves the arm, the radio, or the laptop.
3. **Open** it only in the operator session that holds the matching private key. `@pgpjs/react` hooks and a `PGPProvider` do the same job in the studio UI.
4. **Anchor** the fact that the frame existed, when you need a public clock, on **CDCI** the same way CrypterChat does.

```ts
import PGPJS from '@/lib/pgpjs';

const robot = await PGPJS.generateKey({
  name: 'Prysel arm 04',
  email: 'robot-04@prysel.com',
});

const frame = await PGPJS.seal(
  { joint: 'elbow', deg: 42.1, ts: Date.now() },
  { to: operator.publicKey },
);
```

The plaintext never belongs on the wire. The chain never belongs in the robot’s RAM. PGPJS is the seam between those two worlds — and the CLI is how the bench installs that seam.

## One stack, three tools

| Layer  | Who                    | What the CLI / PGPJS does              |
| ------ | ---------------------- | -------------------------------------- |
| Studio | Prysel Robotics Studio | `pgpjs init`, keys, sealed telemetry   |
| Chat   | CrypterChat / ChatScan | Sealed messages; explorer sees digests |
| Chain  | CentralDB / CDCI       | X11 + ChainLocks for the commitment    |

A mission note typed in the studio can be sealed with PGPJS, posted through CrypterChat so the team can coordinate without a readable archive, and anchored on CDCI so the run is timestamped. ChatScan will show `{HASH}/{ID-number}` and refuse the body. That is the point.

## Git

- Studio: [CerveauAnalytique/Prysel.Robotics-Studio-](https://github.com/CerveauAnalytique/Prysel.Robotics-Studio-.git)
- CLI source: [pgpjs/cli](https://github.com/pgpjs/cli)
- Sister stories: [Prysel Robotics Studio](/prysel/robotics-studio/git) · [CentralDB CDCI](/centraldb/cdci/git) · [CrypterChat ChatScan](/crypterchat/chatscan/git)
- Downloads: [Windows](/cli/windows) · [macOS](/cli/macos) · [Overview](/overview)
