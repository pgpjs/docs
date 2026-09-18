# Make a login token

<p class="blog-kicker">Blackeye · pig CLI</p>

PGPJS login uses the same token model as [BlackeyE 3.1](https://github.com/EricksonAtHome/BlackeyE3.1). A token is two pieces:

| Piece    | Name    | What it is                                     |
| -------- | ------- | ---------------------------------------------- |
| `pgpid`  | PGP ID  | 64-character hex token (`pig create token`)    |
| `codeid` | Code ID | Optional password. Use `-` in the URL if none. |

The login URL is:

```
https://pgpjs.org/auth/{pgpid}/{codeid}
```

The homepage footer **login** link opens `/auth/`. After you sign in, the browser stays on that URL.

## Create a token

From this repository (Node.js 20.10 or newer):

```bash
node scripts/pig.mjs create token
```

<button type="button" class="install-copy" data-copy="node scripts/pig.mjs create token">Copy</button>

The CLI is the Blackeye `pig` command. It prints:

1. **PGP ID** — the token
2. **Code ID** — the password you typed, or none
3. **Login URL** — `/auth/{pgpid}/{codeid}`

It writes:

- `tokens.json` at the repo root (private, gitignored)
- a SHA-256 hash into `docs/auth/tokens.hashes.json` (safe to deploy)

Skip the password prompt:

```bash
node scripts/pig.mjs create token --no-password
```

Then the Code ID in the URL is `-`.

## Install the token on the site

Deploy `docs/auth/tokens.hashes.json` with the rest of the docs (Netlify publish of `docs/`). Until that file contains the new hash, login will say the token was not found.

Do **not** commit `tokens.json`. That file holds the raw PGP ID and Code ID.

## Delete a token

```bash
node scripts/pig.mjs delete token <pgpid>
```

That removes it from `tokens.json` and drops its hash from `tokens.hashes.json`. Deploy again.

## Upstream

Blackeye source, screenshots, and WalletConnect dashboard:

https://github.com/EricksonAtHome/BlackeyE3.1
