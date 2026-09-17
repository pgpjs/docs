# Contribute

## Introduction

Thank you for considering contributing to PGPJS.

PGPJS is a rebrand of [Docsify](https://github.com/docsifyjs/docsify). We welcome any type of contribution, not only code. You can help with

- **QA**: file bug reports, the more details you can give the better (e.g. screenshots with the console open)
- **Documentation**: improving guides, examples, and API docs
- **Code**: take a look at the [open issues](https://github.com/pgpjs/docs/issues). Even if you can't write code, commenting on them, showing that you care about a given issue matters. It helps us triage them.

## Your First Contribution

Working on your first Pull Request ever? You can learn how from this _free_ series, [How to Contribute to an Open Source Project on GitHub](https://app.egghead.io/playlists/how-to-contribute-to-an-open-source-project-on-github).

```bash
npm install && npm run dev
```

- Fork it!
- Create your feature branch: `git checkout -b my-new-feature`
- Commit your changes: `git add . && git commit -m 'Add some feature'`
- Push to the branch: `git push origin my-new-feature`
- Submit a pull request

## Submitting code

Any code change should be submitted as a pull request. The description should explain what the code does and give steps to execute it. The pull request should also contain tests.

## Testing

Ensure that things work by running:

```sh
npm test
```

## Test Snapshots

If a snapshot fails, or to add new snapshots, run:

```sh
npx jest --updateSnapshot
```

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
