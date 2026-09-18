/**
 * Run ChatScan as the PGPJS site backend: explorer API, local sealer daemon,
 * optional CDCI JSON-RPC. Shared by `npm run serve` and the Netlify function.
 */
import { Readable } from 'node:stream';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

import { createApp } from './chatscan/src/index.js';
import { networkSnapshot } from './chatscan/src/core/network.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'Content-Type, Authorization, X-ChatScan-Key',
  'access-control-max-age': '86400',
};

let app;

function dataDir() {
  if (process.env.CHATSCAN_DATA_DIR) {
    return process.env.CHATSCAN_DATA_DIR;
  }
  if (process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return join(tmpdir(), 'pgpjs-chatscan');
  }
  return join(root, 'backend/data');
}

export function getApp() {
  if (app) {
    return app;
  }
  const dir = dataDir();
  mkdirSync(dir, { recursive: true });
  process.env.CHATSCAN_CHAIN_BACKEND ??= 'local';
  process.env.CHATSCAN_PERSIST ??= 'true';
  process.env.CHATSCAN_DATA_DIR ??= dir;
  process.env.CHATSCAN_SEALER_ENABLED ??= 'true';
  process.env.CHATSCAN_NETWORK ??= 'pgpjs-chatscan';
  process.env.CHATSCAN_CHAIN_ID ??= 'pgpjs:chatscan';
  process.env.CHATSCAN_SEALED_BY ??= 'pgpjs-local-daemon';
  app = createApp();
  app.chain.start();
  return app;
}

export async function stopApp() {
  if (!app) {
    return;
  }
  app.chain.stop();
  await app.store.flush();
  app = undefined;
}

export async function connectionStatus(instance = getApp()) {
  const snapshot = await networkSnapshot({
    store: instance.store,
    config: instance.config,
    chain: instance.chain,
  });
  const chain = snapshot.chain || {};
  const local = snapshot.backend === 'local';
  const chatscanOk =
    snapshot.status === 'online' ||
    snapshot.status === 'paused' ||
    snapshot.status === 'syncing';
  const daemonOk = local
    ? Boolean(instance.config.sealerEnabled)
    : Boolean(chain.reachable);
  const cdciOk = !local && Boolean(chain.reachable);
  return {
    ok: chatscanOk && daemonOk,
    chatscan: {
      ok: chatscanOk,
      status: snapshot.status,
      records: snapshot.throughput?.records ?? 0,
      chainId: snapshot.chainId,
      network: snapshot.network,
    },
    daemon: {
      ok: daemonOk,
      name: local ? instance.config.sealedBy : 'centraldatabased',
      backend: snapshot.backend,
      height: snapshot.height,
      sealer: snapshot.sealer,
    },
    cdci: {
      ok: cdciOk,
      network: instance.config.cdci.network,
      reachable: Boolean(chain.reachable),
      rpcUrl: local ? null : chain.rpcUrl || instance.config.cdci.rpcUrl,
      note: local
        ? 'github.com/Centraldb/CDCI is not public. This site runs ChatScan local sealer as the daemon. Set CHATSCAN_CHAIN_BACKEND=cdci and CDCI_RPC_URL when centraldatabased is available.'
        : null,
    },
    algorithm: snapshot.algorithm,
    privacy: snapshot.privacy,
  };
}

function isConnectionPath(pathname) {
  return pathname === '/api/v1/connection' || pathname === '/api/connection';
}

function isApiPath(pathname) {
  return (
    pathname === '/healthz' ||
    pathname.startsWith('/api/') ||
    isConnectionPath(pathname)
  );
}

export function isChatScanPath(pathname) {
  return isApiPath(pathname);
}

function withCors(res) {
  const orig = res.writeHead.bind(res);
  res.writeHead = (status, headers = {}) =>
    orig(status, { ...CORS, ...headers });
  return res;
}

class CollectingResponse {
  constructor() {
    this.statusCode = 200;
    this.headers = {};
    this.body = [];
    this.headersSent = false;
    this.finished = false;
    this.done = new Promise(resolve => {
      this._resolve = resolve;
    });
  }

  writeHead(status, messageOrHeaders, maybeHeaders) {
    this.statusCode = status;
    this.headersSent = true;
    const headers =
      typeof messageOrHeaders === 'object' && messageOrHeaders
        ? messageOrHeaders
        : maybeHeaders || {};
    for (const [key, value] of Object.entries(headers)) {
      this.headers[key.toLowerCase()] = Array.isArray(value)
        ? value.join(', ')
        : String(value);
    }
    return this;
  }

  setHeader(key, value) {
    this.headers[key.toLowerCase()] = String(value);
  }

  getHeader(key) {
    return this.headers[key.toLowerCase()];
  }

  write(chunk) {
    if (chunk) {
      this.body.push(Buffer.from(chunk));
    }
    return true;
  }

  end(chunk) {
    if (chunk) {
      this.body.push(Buffer.from(chunk));
    }
    this.finished = true;
    this.headersSent = true;
    this._resolve();
  }

  destroy() {
    this.finished = true;
    this._resolve();
  }

  flushHeaders() {}

  once(event, fn) {
    if (event === 'finish') {
      this.done.then(fn);
    }
    return this;
  }

  on(event, fn) {
    return this.once(event, fn);
  }
}

async function fetchToIncoming(request) {
  const url = resolveApiUrl(request);
  const buffer = Buffer.from(await request.arrayBuffer());
  const req = Readable.from(buffer.length ? [buffer] : []);
  req.method = request.method;
  req.url = `${url.pathname}${url.search}`;
  req.headers = {};
  request.headers.forEach((value, key) => {
    req.headers[key.toLowerCase()] = value;
  });
  if (!req.headers['content-length']) {
    req.headers['content-length'] = String(buffer.length);
  }
  req.socket = { remoteAddress: '0.0.0.0' };
  req.httpVersion = '1.1';
  req.httpVersionMajor = 1;
  req.httpVersionMinor = 1;
  return req;
}

export function resolveApiUrl(request) {
  const url = new URL(request.url);
  const forwarded =
    request.headers.get('x-forwarded-uri') ||
    request.headers.get('x-original-uri') ||
    request.headers.get('x-netlify-original-pathname');
  if (url.pathname.startsWith('/.netlify/functions/')) {
    if (forwarded) {
      const [path, search] = forwarded.split('?');
      url.pathname = path;
      if (search) {
        url.search = `?${search}`;
      }
    }
  }
  return url;
}

function jsonResponse(payload, status = 200) {
  return new Response(`${JSON.stringify(payload, null, 2)}\n`, {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...CORS,
    },
  });
}

export async function handleFetch(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }
  const url = resolveApiUrl(request);
  const instance = getApp();
  if (isConnectionPath(url.pathname)) {
    return jsonResponse(await connectionStatus(instance));
  }
  const req = await fetchToIncoming(request);
  req.url = `${url.pathname}${url.search}`;
  const res = withCors(new CollectingResponse());
  instance.server.emit('request', req, res);
  await res.done;
  const headers = { ...CORS, ...res.headers };
  return new Response(Buffer.concat(res.body), {
    status: res.statusCode,
    headers,
  });
}

export async function handleNodeRequest(req, res) {
  const pathOnly = (req.url || '/').split('?')[0];
  if (req.method === 'OPTIONS' && isApiPath(pathOnly)) {
    res.writeHead(204, CORS);
    res.end();
    return;
  }
  const instance = getApp();
  if (isConnectionPath(pathOnly)) {
    const payload = await connectionStatus(instance);
    const body = `${JSON.stringify(payload, null, 2)}\n`;
    res.writeHead(200, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...CORS,
    });
    res.end(body);
    return;
  }
  withCors(res);
  await new Promise(resolve => {
    res.once('finish', resolve);
    instance.server.emit('request', req, res);
  });
}

export { CORS, isApiPath };
