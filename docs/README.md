# PGPJS

> Pretty Good Privacy | JavaScript documentation site generator.

## What it is

PGPJS turns your Markdown files into a documentation website instantly. Unlike most other documentation site generator tools, it doesn't need to build HTML files. Instead, it dynamically loads and parses your Markdown files and displays them as a website.

PGPJS is a rebrand of [Docsify](https://github.com/docsifyjs/docsify). Configuration is available as `window.$pgpjs`, and the original `window.$docsify` API remains supported.

To get started, create an `index.html` file and [deploy it on GitHub Pages](deploy.md) (for more details see the [Quick start](quickstart.md) guide).

## Features

- No statically built HTML files
- Simple and lightweight
- Smart full-text search plugin
- Multiple themes
- Useful plugin API
- Emoji support

## Name

The product name is **PGPJS** (Pretty Good Privacy | JavaScript). Use it in page titles, cover pages, and `name` configuration:

```js
window.$pgpjs = {
  name: 'PGPJS',
};
```
