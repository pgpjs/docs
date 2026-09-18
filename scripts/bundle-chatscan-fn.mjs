import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rollup } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'dist-functions');
const outFile = join(outDir, 'chatscan.mjs');

mkdirSync(outDir, { recursive: true });

const bundle = await rollup({
  input: join(root, 'netlify/functions/chatscan.mjs'),
  external: id => id.startsWith('node:'),
  plugins: [nodeResolve({ exportConditions: ['node'] })],
});

await bundle.write({
  file: outFile,
  format: 'es',
  inlineDynamicImports: true,
});
await bundle.close();

console.log(`bundled ChatScan function -> ${outFile}`);
