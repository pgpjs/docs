# How to install MPC

Use this page to install PGPJS MPC on macOS, Linux, or Windows.

## 1. Install Node.js

Node.js **20.10** or newer is required. Check your version:

```bash
node -v
```

## 2. Install the MPC package

In your project directory:

```bash
npm install @pgpjs/mpc
```

<button type="button" class="install-copy" data-copy="npm install @pgpjs/mpc">Copy</button>

That adds `@pgpjs/mpc` to the app. It sits on top of `@pgpjs/core` for RFC 9580 keys and messaging.

If you do not have the core library yet:

```bash
npm install @pgpjs/core @pgpjs/mpc
```

<button type="button" class="install-copy" data-copy="npm install @pgpjs/core @pgpjs/mpc">Copy</button>

## 3. Optional: CLI helper

The PGPJS CLI can print MPC help after you install it globally:

```bash
npm install -g pgpjs-cli
pgpjs mpc --help
```

<button type="button" class="install-copy" data-copy="npm install -g pgpjs-cli">Copy</button>

Download the CLI from [Overview](overview.md). Source: [pgpjs/cli on GitHub](https://github.com/pgpjs/cli).

## 4. Import MPC

```typescript
import MPC from '@pgpjs/mpc';

const session = await MPC.createSession({
  parties: 3,
  threshold: 2,
});
```

## Next

- [MPC overview](/mpc/)
- Live [Core](core/) docs
- [Quick start](quickstart.md)
