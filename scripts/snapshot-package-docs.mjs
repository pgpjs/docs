import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const docs = join(root, 'docs');

const CORE_RAW = 'https://raw.githubusercontent.com/pgpjs/core/main';
const NEXT_RAW = 'https://raw.githubusercontent.com/pgpjs/next/main';
const REACT_RAW = 'https://raw.githubusercontent.com/pgpjs/react/main';
const CORE_JSDELIVR = 'https://cdn.jsdelivr.net/gh/pgpjs/core@main';
const NEXT_JSDELIVR = 'https://cdn.jsdelivr.net/gh/pgpjs/next@main';
const REACT_JSDELIVR = 'https://cdn.jsdelivr.net/gh/pgpjs/react@main';

const TARGETS = [
  {
    out: 'core/README.md',
    urls: [`${CORE_RAW}/README.md`, `${CORE_JSDELIVR}/README.md`],
  },
  {
    out: 'core/architecture.md',
    urls: [
      `${CORE_RAW}/docs/ARCHITECTURE.md`,
      `${CORE_JSDELIVR}/docs/ARCHITECTURE.md`,
    ],
  },
  {
    out: 'core/security.md',
    urls: [`${CORE_RAW}/docs/SECURITY.md`, `${CORE_JSDELIVR}/docs/SECURITY.md`],
  },
  {
    out: 'core/package.md',
    urls: [
      `${CORE_RAW}/packages/core/README.md`,
      `${CORE_JSDELIVR}/packages/core/README.md`,
    ],
  },
  {
    out: 'core/code/pgpjs.md',
    code: 'pgpjs.ts',
    urls: [
      `${CORE_RAW}/packages/core/src/highlevel/pgpjs.ts`,
      `${CORE_JSDELIVR}/packages/core/src/highlevel/pgpjs.ts`,
    ],
  },
  {
    out: 'core/code/index.md',
    code: 'index.ts',
    urls: [
      `${CORE_RAW}/packages/core/src/index.ts`,
      `${CORE_JSDELIVR}/packages/core/src/index.ts`,
    ],
  },
  {
    out: 'next/README.md',
    urls: [
      `${NEXT_RAW}/README.md`,
      `${CORE_RAW}/packages/next/README.md`,
      `${CORE_JSDELIVR}/packages/next/README.md`,
    ],
  },
  {
    out: 'next/code/server.md',
    code: 'server.ts',
    urls: [
      `${NEXT_RAW}/src/server.ts`,
      `${CORE_RAW}/packages/next/src/server.ts`,
      `${CORE_JSDELIVR}/packages/next/src/server.ts`,
    ],
  },
  {
    out: 'next/code/client.md',
    code: 'client.ts',
    urls: [
      `${NEXT_RAW}/src/client.ts`,
      `${CORE_RAW}/packages/next/src/client.ts`,
      `${CORE_JSDELIVR}/packages/next/src/client.ts`,
    ],
  },
  {
    out: 'next/code/index.md',
    code: 'index.ts',
    urls: [
      `${NEXT_RAW}/src/index.ts`,
      `${CORE_RAW}/packages/next/src/index.ts`,
      `${CORE_JSDELIVR}/packages/next/src/index.ts`,
    ],
  },
  {
    out: 'react/README.md',
    urls: [
      `${REACT_RAW}/README.md`,
      `${CORE_RAW}/packages/react/README.md`,
      `${CORE_JSDELIVR}/packages/react/README.md`,
    ],
  },
  {
    out: 'react/code/hooks.md',
    code: 'hooks.ts',
    urls: [
      `${REACT_RAW}/src/hooks.ts`,
      `${CORE_RAW}/packages/react/src/hooks.ts`,
      `${CORE_JSDELIVR}/packages/react/src/hooks.ts`,
    ],
  },
  {
    out: 'react/code/context.md',
    code: 'context.tsx',
    urls: [
      `${REACT_RAW}/src/context.tsx`,
      `${CORE_RAW}/packages/react/src/context.tsx`,
      `${CORE_JSDELIVR}/packages/react/src/context.tsx`,
    ],
  },
  {
    out: 'react/code/index.md',
    code: 'index.ts',
    urls: [
      `${REACT_RAW}/src/index.ts`,
      `${CORE_RAW}/packages/react/src/index.ts`,
      `${CORE_JSDELIVR}/packages/react/src/index.ts`,
    ],
  },
];

async function fetchFirst(urls) {
  for (const url of urls) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        continue;
      }
      const text = await response.text();
      if (text && !text.startsWith('404:')) {
        return { text, url };
      }
    } catch {
      // try the next source
    }
  }
  return null;
}

function wrapCode(filename, source, url) {
  const lang =
    filename.endsWith('.ts') || filename.endsWith('.tsx')
      ? 'typescript'
      : filename.endsWith('.js')
        ? 'javascript'
        : '';
  const fence = source.includes('```') ? '~~~~' : '```';
  return [
    `# \`${filename}\``,
    '',
    `> Snapshot from \`${url}\``,
    '',
    'This file is copied from GitHub at snapshot time so the page is on this site, not fetched in the browser.',
    '',
    fence + lang,
    source.replace(/\n$/, ''),
    fence,
    '',
  ].join('\n');
}

function wrapMarkdown(text, url) {
  return `> Snapshot from \`${url}\`\n\n${text.replace(/^\uFEFF/, '')}`;
}

async function main() {
  let ok = 0;
  let missing = 0;
  for (const target of TARGETS) {
    const result = await fetchFirst(target.urls);
    const outPath = join(docs, target.out);
    await mkdir(dirname(outPath), { recursive: true });
    if (!result) {
      missing += 1;
      console.warn(`skip ${target.out} (upstream unavailable)`);
      continue;
    }
    const body = target.code
      ? wrapCode(target.code, result.text, result.url)
      : wrapMarkdown(result.text, result.url);
    await writeFile(outPath, body);
    ok += 1;
    console.log(`wrote ${target.out} from ${result.url}`);
  }
  console.log(`snapshot: ${ok} written, ${missing} skipped`);
  if (ok === 0) {
    process.exitCode = 1;
  }
}

main();
