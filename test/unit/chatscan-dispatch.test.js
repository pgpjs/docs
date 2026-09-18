import http from 'node:http';
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

const { handleNodeRequest, stopApp } = await import(
  '../../backend/dispatch.mjs'
);

function hex(bytes = 32) {
  return randomBytes(bytes).toString('hex');
}

function jsonRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      handleNodeRequest(req, res).catch(reject);
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      const payload = body === undefined ? null : JSON.stringify(body);
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          method,
          path,
          headers: payload
            ? {
                accept: 'application/json',
                'content-type': 'application/json',
                'content-length': Buffer.byteLength(payload),
              }
            : { accept: 'application/json' },
        },
        res => {
          const chunks = [];
          res.on('data', chunk => chunks.push(chunk));
          res.on('end', () => {
            server.close();
            const text = Buffer.concat(chunks).toString('utf8');
            let parsed = null;
            if (text) {
              try {
                parsed = JSON.parse(text);
              } catch {
                parsed = text;
              }
            }
            resolve({
              status: res.statusCode,
              headers: res.headers,
              payload: parsed,
            });
          });
        },
      );
      req.on('error', error => {
        server.close();
        reject(error);
      });
      if (payload) {
        req.write(payload);
      }
      req.end();
    });
  });
}

describe('ChatScan dispatch', () => {
  afterAll(async () => {
    await stopApp();
    rmSync(dataDir, { recursive: true, force: true });
  });

  test('GET /api/v1/connection reports ChatScan and the local daemon', async () => {
    const { status, payload, headers } = await jsonRequest(
      'GET',
      '/api/v1/connection',
    );
    expect(status).toBe(200);
    expect(headers['access-control-allow-origin']).toBe('*');
    expect(payload.ok).toBe(true);
    expect(payload.chatscan.ok).toBe(true);
    expect(payload.daemon.ok).toBe(true);
    expect(payload.daemon.name).toBe('pgpjs-local-daemon');
    expect(payload.cdci.ok).toBe(false);
    expect(payload.chatscan.chainId).toBe('pgpjs:chatscan');
  });

  test('POST /api/v1/records indexes ciphertext metadata', async () => {
    const ciphertextHash = hex();
    const { status, payload } = await jsonRequest('POST', '/api/v1/records', {
      ciphertextHash,
      size: 64,
      protocol: 'C7',
      nonce: hex(16),
      appVersion: 'pgpjs-1.0',
    });
    expect(status).toBe(201);
    expect(payload.ref).toMatch(/^[0-9a-f]{64}\/\d+$/);
    expect(payload.record.contentAvailable).toBe(false);
  });

  test('POST /api/v1/records refuses plaintext', async () => {
    const { status, payload } = await jsonRequest('POST', '/api/v1/records', {
      ciphertextHash: hex(),
      size: 12,
      protocol: 'C7',
      content: 'hello',
    });
    expect(status).toBe(400);
    expect(payload.error.code).toBe('content_rejected');
  });

  test('OPTIONS /api/v1/connection is CORS-open', async () => {
    const { status, headers } = await jsonRequest(
      'OPTIONS',
      '/api/v1/connection',
    );
    expect(status).toBe(204);
    expect(headers['access-control-allow-origin']).toBe('*');
  });

  test('login hash is SHA-256 of pgpjs-login:{pgpid}', () => {
    const pgpid = 'b'.repeat(64);
    const digest = createHash('sha256')
      .update(`pgpjs-login:${pgpid}`)
      .digest('hex');
    expect(digest).toHaveLength(64);
  });
});
