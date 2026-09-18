import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const docs = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs');
const ORIGIN = 'https://pgpjs.org';

const PATHS = [
  '/',
  '/overview',
  '/quickstart',
  '/cli/windows',
  '/cli/macos',
  '/mpc/',
  '/mpc/install',
  '/core/',
  '/core/architecture',
  '/core/security',
  '/core/package',
  '/core/code/pgpjs',
  '/core/code/index',
  '/next/',
  '/next/code/server',
  '/next/code/client',
  '/next/code/index',
  '/react/',
  '/react/code/hooks',
  '/react/code/context',
  '/react/code/index',
  '/centraldb/cdci/git',
  '/crypterchat/chatscan/git',
  '/prysel/robotics-studio/git',
  '/prysel/cli/git',
  '/auth/',
  '/auth/token',
];

function loc(path) {
  const isPrimary =
    path === '/' ||
    path.startsWith('/core') ||
    path.startsWith('/next') ||
    path.startsWith('/react') ||
    path === '/overview' ||
    path === '/quickstart';
  const priority = path === '/' ? '1.0' : isPrimary ? '0.8' : '0.6';
  return `  <url>
    <loc>${ORIGIN}${path}</loc>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PATHS.map(loc).join('\n')}
</urlset>
`;

await writeFile(join(docs, 'sitemap.xml'), xml);
console.log(`wrote sitemap.xml (${PATHS.length} urls)`);
