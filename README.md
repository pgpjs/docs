<p align="center">
  <a href="https://github.com/pgpjs/docs">
    <img alt="PGPJS" src="./docs/_media/icon.svg" width="160">
  </a>
</p>

<p align="center">
  <strong>PGPJS</strong> — Pretty Good Privacy | JavaScript documentation.
</p>

<p align="center">
  A magical documentation site generator, rebranded from
  <a href="https://github.com/docsifyjs/docsify">Docsify</a>.
</p>

PGPJS turns one or more Markdown files into a website, with no build process required.

This repository is a fork of [Docsify](https://github.com/docsifyjs/docsify) with the product name rebranded to **PGPJS**. Engine APIs such as `window.$docsify` remain supported, and `window.$pgpjs` is accepted as an alias.

## Features

- No statically built HTML files
- Simple and lightweight
- Smart full-text search plugin
- Multiple themes
- Useful plugin API
- Emoji support

## Quick Start

```bash
npm install
npm run serve
```

Then open [http://127.0.0.1:8080](http://127.0.0.1:8080). For local development with live reload:

```bash
npm run dev
```

The live documentation site is the [`docs/`](./docs) folder: P7 homepage, header search, and live Core / Next.js / React docs. It is configured with the name **PGPJS**.

### Deploy on Netlify

Connect this GitHub repository in [Netlify](https://app.netlify.com/) and leave Base directory, Build command, and Publish directory empty. [`netlify.toml`](./netlify.toml) publishes `docs/` as a static site (no `npm run build`). You can also drag-and-drop the `docs/` folder.

To publish `docs/` from GitHub or this machine via the Netlify API, add repository secret `NETLIFY_AUTH_TOKEN` (and optionally a GitHub **production** environment as the approval gate). `NETLIFY_SITE_ID` defaults to pgpjs.org. Then run **Deploy Netlify** from Actions, or:

```bash
cp .env.example .env   # fill in NETLIFY_AUTH_TOKEN
npm run deploy:netlify
```

### Embed PGPJS in a page

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, viewport-fit=cover"
    />
    <link rel="stylesheet" href="/dist/themes/core.min.css" />
    <title>PGPJS</title>
  </head>
  <body>
    <div id="app"></div>
    <script>
      window.$pgpjs = {
        name: 'PGPJS',
        loadSidebar: true,
      };
    </script>
    <script src="/dist/pgpjs.min.js"></script>
  </body>
</html>
```

`window.$docsify` continues to work for compatibility with Docsify plugins and examples.

## Repository layout

- `docs/` — published site (homepage, assets, vendor PGPJS, Netlify files)
- `src/` — PGPJS engine source (Docsify fork)
- `test/` — unit, integration, and end-to-end tests
- `netlify.toml` — static publish of `docs/` (no library build)

## Links

- [Source](https://github.com/pgpjs/docs)
- [Upstream Docsify](https://github.com/docsifyjs/docsify)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)

PGPJS is based on Docsify, which is MIT-licensed. Both copyright notices are retained in [LICENSE](LICENSE).
