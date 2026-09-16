# CDN

PGPJS is distributed from this repository. After building, load scripts and themes from `/dist` instead of an npm CDN.

```bash
npm install
npm run build
npm run serve
```

## Local dist files

Uncompressed resources are available by omitting `.min` from the filename.

<!-- prettier-ignore -->
```html
<!-- Theme -->
<link rel="stylesheet" href="/dist/themes/addons/vue.min.css" />

<!-- PGPJS -->
<script src="/dist/pgpjs.min.js"></script>
```

## ES module

```html
<script type="module">
  import { PGPJS } from '/dist/pgpjs.module.min.js';

  new PGPJS({
    name: 'PGPJS',
  });
</script>
```

## Compatibility

Docsify plugins that read `window.$docsify` still work. PGPJS also accepts `window.$pgpjs`.
