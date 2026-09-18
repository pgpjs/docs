# PGPJS CLI on Windows

<p class="blog-kicker">Download · Windows</p>

This is the Windows download page for the PGPJS CLI — the same toolkit the homepage card **PGPJS on Windows** points at. There is no web UI. `pgpjs` is a command-line program you install with npm, then run from **PowerShell**, Command Prompt, or Windows Terminal.

![PGPJS on Windows](../assets/img/windows.png)

## Install

1. Install [Node.js 20.10 or newer](https://nodejs.org/) (the LTS installer is enough).
2. Open **PowerShell**.
3. Install the CLI globally:

```powershell
npm install -g pgpjs-cli
```

<button type="button" class="install-copy" data-copy="npm install -g pgpjs-cli">Copy</button>

4. Confirm it is on your PATH:

```powershell
pgpjs --help
node -v
```

That splash screen is the CLI from [pgpjs/cli](https://github.com/pgpjs/cli). Cryptography is OpenPGP.js (RFC 9580). The CLI does not invent algorithms, does not talk to the network, and does not ship telemetry.

![pgpjs splash screen](../assets/blog/cli/pgpjs-splash.png)

## Initialize a project

In a Next.js, React, Vite, or Node repo:

```powershell
cd my-app
pgpjs init
pgpjs doctor
```

Then, depending on the stack:

```powershell
pgpjs install next
pgpjs install react
pgpjs install node
```

Keys, encrypt, and sign stay in the terminal:

```powershell
pgpjs key --help
```

![pgpjs key --help](../assets/blog/cli/pgpjs-key-help.png)

## Requirements

- Node.js **>= 20.10**
- Windows 10 or 11
- npm (bundled with Node)

If `pgpjs` is not found after install, close and reopen PowerShell so PATH refreshes, or use `npx pgpjs-cli`.

## Next

- [macOS install](macos.md)
- [CLI inside Prysel Robotics Studio](/prysel/cli/git)
- [All downloads](../overview.md)
- Source: [github.com/pgpjs/cli](https://github.com/pgpjs/cli)
