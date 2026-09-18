# Prysel Robotics Studio

<p class="blog-kicker">Built with PGPJS</p>

Prysel Robotics Studio is the robotics workbench from [CerveauAnalytique](https://github.com/CerveauAnalytique). The Git repository is [Prysel.Robotics-Studio-](https://github.com/CerveauAnalytique/Prysel.Robotics-Studio-.git). Prysel already signs the PGPJS docs site itself — the footer of pgpjs.org is a Prysel mark — so this is not a bolted-on case study. The same org that ships the documentation also ships the studio that _uses_ the library.

![Prysel Robotics Studio](../../../assets/img/prysel_banner-r.png)

![Prysel](../../../assets/blog/prysel/banner.png)

## The story

A robotics studio is a factory for identities. Every robot, every operator laptop, every firmware bundle needs a name that can be proven later. Passwords do not survive a bench. Shared API keys leak into logs. PGPJS is the piece that gives each actor an RFC 9580 keypair and a way to seal telemetry without standing up a custom crypto team.

In the studio the loop looks like this:

1. **Pair** a robot with `PGPJS.generateKey` — Ed25519 for signatures, X25519 for sealing.
2. **Seal** a telemetry frame or a mission file with `PGPJS.seal` before it leaves the arm, the radio, or the laptop.
3. **Open** it only in the operator session that holds the matching private key, through `@pgpjs/react` hooks and a `PGPProvider`.

The plaintext never belongs on the wire. PGPJS is the seam between the robot and the operator.

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

That is the same `encrypt.ts` card on the PGPJS homepage, pointed at a robot instead of a web form.

## Git

- Studio: [CerveauAnalytique/Prysel.Robotics-Studio-](https://github.com/CerveauAnalytique/Prysel.Robotics-Studio-.git)
- Org: [github.com/CerveauAnalytique](https://github.com/CerveauAnalytique)
- Site mark: [prysel.com](https://prysel.com)
- CLI on the bench: [PGPJS CLI in Prysel Robotics Studio](/prysel/cli/git)
- PGPJS React bindings: [@pgpjs/react](/react/)
