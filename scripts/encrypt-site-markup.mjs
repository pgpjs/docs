import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const markupPath = join(root, 'scripts/site-markup.html');
const indexPath = join(root, 'docs/index.html');
const unlockPath = join(root, 'docs/pgpjs-unlock.js');
const KEY = 'pgpjs-unlock';

const UNLOCK_START = '    <script src="/pgpjs-unlock.js';
const LIVE_DOCS = '    <script src="/live-docs.js"></script>';
const CHROME_START = '    <div class="pgpjs-chrome">';

function xorBase64(text, key) {
  const keyBytes = Buffer.from(key);
  const input = Buffer.from(text, 'utf8');
  const out = Buffer.alloc(input.length);
  for (let i = 0; i < input.length; i += 1) {
    out[i] = input[i] ^ keyBytes[i % keyBytes.length];
  }
  return out.toString('base64');
}

function extractMarkup(indexHtml) {
  const start = indexHtml.indexOf(CHROME_START);
  const end = indexHtml.indexOf(LIVE_DOCS);
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Could not find site markup bounds in docs/index.html');
  }
  return indexHtml.slice(start, end).trim();
}

function unlockSource(payload) {
  return `(function () {
  const KEY = '${KEY}';
  const PAYLOAD = '${payload}';
  const keyBytes = new TextEncoder().encode(KEY);
  const binary = atob(PAYLOAD);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i) ^ keyBytes[i % keyBytes.length];
  }
  const html = new TextDecoder().decode(bytes);
  document.currentScript.insertAdjacentHTML('beforebegin', html);
})();
`;
}

let indexHtml = readFileSync(indexPath, 'utf8');
let markup;

try {
  markup = readFileSync(markupPath, 'utf8').trim();
} catch {
  markup = extractMarkup(indexHtml);
  writeFileSync(markupPath, `${markup}\n`);
}

const payload = xorBase64(markup, KEY);
writeFileSync(unlockPath, unlockSource(payload));

if (indexHtml.includes(CHROME_START) && indexHtml.includes(LIVE_DOCS)) {
  const start = indexHtml.indexOf(CHROME_START);
  const end = indexHtml.indexOf(LIVE_DOCS);
  indexHtml = `${indexHtml.slice(0, start)}    <noscript>
      PGPJS documentation requires JavaScript.
    </noscript>
    <script src="/pgpjs-unlock.js?v=seo-history"></script>

${indexHtml.slice(end)}`;
} else if (!indexHtml.includes(UNLOCK_START)) {
  throw new Error(
    'docs/index.html is missing both site markup and unlock script',
  );
}

writeFileSync(indexPath, indexHtml);
console.log(
  `Encrypted ${markup.length} bytes of site markup into docs/pgpjs-unlock.js`,
);
