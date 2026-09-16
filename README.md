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

The documentation site lives in [`docs/`](./docs) and is configured with the name **PGPJS**.

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

## Links

- [Source](https://github.com/pgpjs/docs)
- [Upstream Docsify](https://github.com/docsifyjs/docsify)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)

PGPJS is based on Docsify, which is MIT-licensed. Both copyright notices are retained in [LICENSE](LICENSE).
