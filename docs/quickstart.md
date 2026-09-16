# Quick start

Install dependencies and serve the PGPJS documentation site from this repository:

```bash
npm install
npm run serve
```

Then open [http://127.0.0.1:8080](http://127.0.0.1:8080). For live reload during development:

```bash
npm run dev
```

## Writing content

The documentation lives in the `./docs` subdirectory.

- `index.html` as the entry file
- `README.md` as the home page
- `.nojekyll` prevents GitHub Pages from ignoring files that begin with an underscore

You can easily update the documentation in `./docs/README.md`, and of course you can add [more pages](adding-pages.md).

## Manual initialization

Download or create an `index.html` template using the following markup:

<div id="template">

<a href="#" class="button primary" download="index.html">Download Template</a>

<!-- prettier-ignore -->
```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <title>PGPJS</title>

    <!-- Core Theme -->
    <link rel="stylesheet" href="/dist/themes/core.min.css">
  </head>
  <body class="loading">
    <div id="app"></div>

    <!-- Configuration -->
    <script>
      window.$pgpjs = {
        name: 'PGPJS',
      };
    </script>

    <!-- PGPJS -->
    <script src="/dist/pgpjs.min.js"></script>

    <!-- Plugins (optional) -->
    <!-- <script src="/dist/plugins/search.min.js"></script> -->
  </body>
</html>
```

</div>

`window.$docsify` continues to work as a compatibility alias for Docsify plugins and examples.

### Local assets

After `npm run build`, PGPJS scripts and themes are available under `/dist/`:

<!-- prettier-ignore -->
```html
<!-- Core Theme -->
<link rel="stylesheet" href="/dist/themes/core.min.css">

<!-- PGPJS -->
<script src="/dist/pgpjs.min.js"></script>
```

### Manually preview your site

If you have Python installed on your system, you can easily use it to run a static file server:

```bash
cd docs
python3 -m http.server 3000
```

Then visit `http://localhost:3000`. For the full PGPJS preview with `/dist` assets, prefer `npm run serve`.
