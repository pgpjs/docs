import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API = 'https://api.netlify.com/api/v1';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = join(root, 'docs');

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

async function netlifyFetch(path, token, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!response.ok) {
    const detail = typeof data === 'string' ? data : JSON.stringify(data);
    fail(`Netlify API ${response.status} ${path}: ${detail}`);
  }
  return data;
}

async function triggerHook(hookUrl) {
  const response = await fetch(hookUrl, { method: 'POST' });
  if (!response.ok) {
    fail(`Deploy hook failed: ${response.status} ${await response.text()}`);
  }
  console.log('Triggered Netlify build hook. Netlify will rebuild from Git.');
}

async function waitForDeploy(token, deployId) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const deploy = await netlifyFetch(`/deploys/${deployId}`, token);
    if (deploy.state === 'ready' || deploy.state === 'current') {
      return deploy;
    }
    if (deploy.state === 'error' || deploy.state === 'rejected') {
      fail(deploy.error_message || `Netlify deploy ${deploy.state}`);
    }
    await new Promise(resolve => {
      setTimeout(resolve, 3000);
    });
  }
  fail('Timed out waiting for Netlify deploy');
}

function zipDocs() {
  const work = mkdtempSync(join(tmpdir(), 'pgpjs-netlify-'));
  const zipPath = join(work, 'site.zip');
  execFileSync('zip', ['-r', '-q', zipPath, '.'], { cwd: docsDir });
  return { work, zipPath, body: readFileSync(zipPath) };
}

async function uploadZip({ token, siteId, prod }) {
  const { work, body } = zipDocs();
  try {
    const query = prod ? '' : '?draft=true';
    const created = await netlifyFetch(
      `/sites/${encodeURIComponent(siteId)}/deploys${query}`,
      token,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/zip' },
        body,
      },
    );
    const deploy = await waitForDeploy(token, created.id);
    const published = deploy.ssl_url || deploy.url;
    const preview = deploy.deploy_ssl_url || deploy.deploy_url;
    console.log(`Netlify deploy ${deploy.id} (${deploy.state})`);
    if (published) {
      console.log(`Published: ${published}`);
    }
    if (preview && preview !== published) {
      console.log(`Preview: ${preview}`);
    }
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const token = process.env.NETLIFY_AUTH_TOKEN;
  const siteId = process.env.NETLIFY_SITE_ID || process.env.NETLIFY_SITE;
  const hookUrl = process.env.NETLIFY_DEPLOY_HOOK;

  if (args.hookOnly || (!token && hookUrl)) {
    if (!hookUrl) {
      fail('Set NETLIFY_DEPLOY_HOOK to trigger a Git rebuild.');
    }
    await triggerHook(hookUrl);
    return;
  }

  if (!token || !siteId) {
    fail(
      [
        'Set NETLIFY_AUTH_TOKEN and NETLIFY_SITE_ID to deploy docs/ via the Netlify API.',
        'Create a token at https://app.netlify.com/user/applications#personal-access-tokens',
        'Site ID is in Site configuration → General → Site details.',
        'Or set NETLIFY_DEPLOY_HOOK and run: npm run deploy:netlify -- --hook',
      ].join('\n'),
    );
  }

  await uploadZip({ token, siteId, prod: args.prod });
}

main().catch(error => {
  fail(error instanceof Error ? error.message : String(error));
});
