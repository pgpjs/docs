import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = join(root, 'docs');
const functionsDir = join(root, 'netlify/functions');

function fail(message) {
  console.error(message);
  process.exit(1);
}

function parseArgs(argv) {
  return {
    prod: !argv.includes('--draft'),
    hookOnly: argv.includes('--hook'),
  };
}

async function triggerHook(hookUrl) {
  const response = await fetch(hookUrl, { method: 'POST' });
  if (!response.ok) {
    fail(`Deploy hook failed: ${response.status} ${await response.text()}`);
  }
  console.log('Triggered Netlify build hook. Netlify will rebuild from Git.');
}

function deployWithCli({ token, siteId, prod }) {
  const args = [
    'deploy',
    '--dir',
    docsDir,
    '--functions',
    functionsDir,
    '--site',
    siteId,
  ];
  if (prod) {
    args.push('--prod');
  }
  execFileSync('netlify', args, {
    cwd: root,
    env: { ...process.env, NETLIFY_AUTH_TOKEN: token },
    stdio: 'inherit',
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const token = process.env.NETLIFY_AUTH_TOKEN;
  const siteId =
    process.env.NETLIFY_SITE_ID ||
    process.env.NETLIFY_SITE ||
    '2d2bad4f-7244-484a-8e3f-608ab487a382';
  const hookUrl = process.env.NETLIFY_DEPLOY_HOOK;

  if (args.hookOnly || (!token && hookUrl)) {
    if (!hookUrl) {
      fail('Set NETLIFY_DEPLOY_HOOK to trigger a Git rebuild.');
    }
    await triggerHook(hookUrl);
    return;
  }

  if (!token) {
    fail(
      [
        'Set NETLIFY_AUTH_TOKEN to deploy docs/ and ChatScan functions.',
        'Create a token at https://app.netlify.com/user/applications#personal-access-tokens',
        'NETLIFY_SITE_ID defaults to the pgpjs.org site; override it if needed.',
        'Or set NETLIFY_DEPLOY_HOOK and run: npm run deploy:netlify -- --hook',
      ].join('\n'),
    );
  }

  deployWithCli({ token, siteId, prod: args.prod });
}

main().catch(error => {
  fail(error instanceof Error ? error.message : String(error));
});
