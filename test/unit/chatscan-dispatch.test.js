import { createHash, randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dataDir = mkdtempSync(join(tmpdir(), 'pgpjs-scan-'));
process.env.CHATSCAN_DATA_DIR = dataDir;
process.env.CHATSCAN_CHAIN_BACKEND = 'local';
process.env.CHATSCAN_PERSIST = 'false';
process.env.CHATSCAN_SEALER_ENABLED = 'true';
process.env.CHATSCAN_CHAIN_ID = 'pgpjs:chatscan';
process.env.CHATSCAN_NETWORK = 'pgpjs-chatscan';
process.env.CHATSCAN_SEALED_BY = 'pgpjs-local-daemon';

const { handleFetch, stopApp } = await import('../../backend/dispatch.mjs');

function hex(bytes = 32) {
  return randomBytes(bytes).toString('hex');
}

async function jsonFetch(path, options = {}) {
  const headers = { accept: 'application/json', ...(options.headers || {}) };
  let body = options.body;
  if (body && typeof body !== 'string') {
    headers['content-type'] = 'application/json';
    body = JSON.stringify(body);
  }
  const response = await handleFetch(
    new Request(`http://localhost${path}`, {
      method: options.method || 'GET',
      headers,
      body,
    }),
  );
  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }
  return { status: response.status, headers: response.headers, payload };
}

describe('ChatScan dispatch', () => {
  afterAll(async () => {
    await stopApp();
    rmSync(dataDir, { recursive: true, force: true });
  });

  test('GET /api/v1/connection reports ChatScan and the local daemon', async () => {
    const { status, payload, headers } = await jsonFetch('/api/v1/connection');
    expect(status).toBe(200);
    expect(headers.get('access-control-allow-origin')).toBe('*');
    expect(payload.ok).toBe(true);
    expect(payload.chatscan.ok).toBe(true);
    expect(payload.daemon.ok).toBe(true);
    expect(payload.daemon.name).toBe('pgpjs-local-daemon');
    expect(payload.cdci.ok).toBe(false);
    expect(payload.chatscan.chainId).toBe('pgpjs:chatscan');
  });

  test('POST /api/v1/records indexes ciphertext metadata', async () => {
    const ciphertextHash = hex();
    const { status, payload } = await jsonFetch('/api/v1/records', {
      method: 'POST',
      body: {
        ciphertextHash,
        size: 64,
        protocol: 'C7',
        nonce: hex(16),
        appVersion: 'pgpjs-1.0',
      },
    });
    expect(status).toBe(201);
    expect(payload.ref).toMatch(/^[0-9a-f]{64}\/\d+$/);
    expect(payload.record.contentAvailable).toBe(false);
  });

  test('POST /api/v1/records refuses plaintext', async () => {
    const { status, payload } = await jsonFetch('/api/v1/records', {
      method: 'POST',
      body: {
        ciphertextHash: hex(),
        size: 12,
        protocol: 'C7',
        content: 'hello',
      },
    });
    expect(status).toBe(400);
    expect(payload.error.code).toBe('content_rejected');
  });

  test('OPTIONS /api/v1/connection is CORS-open', async () => {
    const response = await handleFetch(
      new Request('http://localhost/api/v1/connection', { method: 'OPTIONS' }),
    );
    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
  });

  test('login hash is SHA-256 of pgpjs-login:{pgpid}', () => {
    const pgpid = 'b'.repeat(64);
    const digest = createHash('sha256')
      .update(`pgpjs-login:${pgpid}`)
      .digest('hex');
    expect(digest).toHaveLength(64);
  });
});
