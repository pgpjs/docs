/**
 * PGPJS Scan SDK — check ChatScan / CDCI daemon connection and record
 * ciphertext metadata (never message content) from any PGPJS app.
 *
 *   import { PgpjsScan } from 'https://pgpjs.org/sdk/pgpjs-scan.js';
 *   const scan = await PgpjsScan.connect();
 *   const health = await scan.checkConnection();
 */
import { ChatScanClient } from './chatscan/client.js';
import { ChatScanError } from './chatscan/errors.js';
import {
  digestCiphertext,
  generateNonce,
  channelHash,
} from './chatscan/crypto.js';
import { ChatSession } from './chatscan/session.js';

export { ChatScanClient, ChatScanError, ChatSession };
export {
  digestCiphertext,
  generateNonce,
  channelHash,
} from './chatscan/crypto.js';
export { anchorCommitment, anchorInstructions } from './chatscan/commitment.js';

const LOGIN_CHANNEL = 'pgpjs/login';

function originBase(baseUrl) {
  if (baseUrl) {
    return String(baseUrl).replace(/\/+$/, '');
  }
  if (typeof location !== 'undefined' && location.origin) {
    return location.origin;
  }
  return 'https://pgpjs.org';
}

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export class PgpjsScan {
  /**
   * @param {object} [options]
   * @param {string} [options.baseUrl]
   * @param {string} [options.ingestKey]
   * @param {string} [options.appVersion]
   */
  constructor(options = {}) {
    this.baseUrl = originBase(options.baseUrl);
    this.appVersion = options.appVersion || 'pgpjs-1.0';
    this.client = new ChatScanClient({
      baseUrl: this.baseUrl,
      ingestKey: options.ingestKey,
    });
  }

  static async connect(options = {}) {
    const scan = new PgpjsScan(options);
    await scan.checkConnection();
    return scan;
  }

  /** ChatScan explorer + local daemon + optional CDCI node. */
  async checkConnection() {
    const response = await fetch(`${this.baseUrl}/api/v1/connection`, {
      headers: { accept: 'application/json' },
    });
    if (!response.ok) {
      throw new ChatScanError({
        status: response.status,
        code: 'connection_failed',
        message: `Connection check failed (${response.status})`,
      });
    }
    this.health = await response.json();
    return this.health;
  }

  session(options = {}) {
    return ChatSession.connect({
      baseUrl: this.baseUrl,
      ingestKey: options.ingestKey,
      appVersion: options.appVersion || this.appVersion,
      wallet: options.wallet,
    });
  }

  /**
   * Record that a PGPJS app sealed a payload. Pass ciphertext bytes or a
   * 64-char hex digest. Plaintext is refused by ChatScan.
   * @param {object} input
   * @param {Uint8Array|ArrayBuffer} [input.ciphertext]
   * @param {string} [input.ciphertextHash]
   * @param {number} [input.size]
   * @param {string} [input.conversation]
   * @param {string} [input.protocol]
   */
  async recordSealed(input = {}) {
    let ciphertextHash = input.ciphertextHash;
    let size = input.size;
    if (input.ciphertext) {
      const digest = await digestCiphertext(input.ciphertext);
      ciphertextHash = digest.ciphertextHash;
      size = digest.size;
    }
    const conversation = input.conversation || 'pgpjs';
    const record = await this.client.submitRecord({
      ciphertextHash,
      size,
      protocol: input.protocol || 'C7',
      channelHash: await channelHash(conversation),
      nonce: generateNonce(),
      appVersion: this.appVersion,
    });
    return record;
  }

  /**
   * Login ledger: hash the PGP ID, never send the token or code ID.
   * @param {{ pgpid: string }} input
   */
  async recordLogin({ pgpid }) {
    if (!/^[0-9a-f]{64}$/i.test(pgpid || '')) {
      throw new TypeError('pgpid must be the 64-character hex token');
    }
    const ciphertextHash = await sha256Hex(
      `pgpjs-login:${String(pgpid).toLowerCase()}`,
    );
    return this.client.submitRecord({
      ciphertextHash,
      size: 32,
      protocol: 'C7',
      channelHash: await channelHash(LOGIN_CHANNEL),
      nonce: generateNonce(),
      appVersion: this.appVersion,
    });
  }

  listRecords(query) {
    return this.client.listRecords(query);
  }

  status() {
    return this.client.status();
  }
}

if (typeof window !== 'undefined') {
  window.PgpjsScan = PgpjsScan;
}

export const VERSION = '1.0.0';
