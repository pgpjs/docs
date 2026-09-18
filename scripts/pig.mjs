#!/usr/bin/env node
/**
 * Blackeye token CLI, adapted from
 * https://github.com/EricksonAtHome/BlackeyE3.1/blob/main/bin/pig.js
 *
 *   node scripts/pig.mjs create token
 *   node scripts/pig.mjs delete token <pgpid>
 */
import { createHash, randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const DB_PATH = join(root, 'tokens.json');
const HASH_PATH = join(root, 'docs/auth/tokens.hashes.json');
const ORIGIN = 'https://pgpjs.org';

function initDB() {
  if (!existsSync(DB_PATH)) {
    writeFileSync(DB_PATH, '{}\n', 'utf8');
  }
}

function readDB() {
  initDB();
  return JSON.parse(readFileSync(DB_PATH, 'utf8'));
}

function writeDB(data) {
  writeFileSync(DB_PATH, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function readHashes() {
  if (!existsSync(HASH_PATH)) {
    return { hashes: [] };
  }
  return JSON.parse(readFileSync(HASH_PATH, 'utf8'));
}

function writeHashes(data) {
  writeFileSync(HASH_PATH, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function generateToken(length = 32) {
  return randomBytes(length).toString('hex');
}

function tokenHash(pgpid, codeid) {
  return createHash('sha256')
    .update(`${String(pgpid).toLowerCase()}:${codeid || ''}`)
    .digest('hex');
}

function printUsage() {
  console.log('Usage:');
  console.log('  node scripts/pig.mjs create token [--no-password]');
  console.log('  node scripts/pig.mjs delete token <pgpid>');
}

function finishCreate(password) {
  const pgpid = generateToken();
  const codeid = password || '';
  const db = readDB();
  db[pgpid] = {
    password: codeid || null,
    createdAt: new Date().toISOString(),
  };
  writeDB(db);

  const hashes = readHashes();
  const hash = tokenHash(pgpid, codeid);
  if (!hashes.hashes.includes(hash)) {
    hashes.hashes.push(hash);
    writeHashes(hashes);
  }

  const pathCode = encodeURIComponent(codeid || '-');
  console.log('\n=========================================');
  console.log(' NEW TOKEN GENERATED');
  console.log('=========================================');
  console.log(`\nPGP ID (token): ${pgpid}`);
  console.log(`Code ID: ${codeid || '(none — use "-" in the URL)'}`);
  console.log(`\nLogin URL:\n  ${ORIGIN}/auth/${pgpid}/${pathCode}`);
  console.log(
    '\nDeploy docs/auth/tokens.hashes.json so this token works on pgpjs.org.',
  );
  console.log('Keep tokens.json private. It is gitignored.\n');
}

const args = process.argv.slice(2);
if (args.length === 0) {
  printUsage();
  process.exit(1);
}

const command = args[0];
const target = args[1];

if (command === 'create' && target === 'token') {
  const skipPassword = args.includes('--no-password') || !process.stdin.isTTY;
  if (skipPassword) {
    finishCreate(null);
  } else {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    console.log('\nCreating a new token...');
    rl.question(
      'Type a code ID for this token (or press Enter to skip): ',
      answer => {
        finishCreate(answer.trim() || null);
        rl.close();
      },
    );
  }
} else if (command === 'delete' && target === 'token') {
  const pgpid = args[2];
  if (!pgpid) {
    console.error('Error: Please provide the PGP ID to delete.');
    printUsage();
    process.exit(1);
  }
  const db = readDB();
  if (!db[pgpid]) {
    console.error('\nError: Token not found in tokens.json.\n');
    process.exit(1);
  }
  const hash = tokenHash(pgpid, db[pgpid].password || '');
  delete db[pgpid];
  writeDB(db);
  const hashes = readHashes();
  hashes.hashes = (hashes.hashes || []).filter(item => item !== hash);
  writeHashes(hashes);
  console.log('\nSuccess: Token deleted.\n');
} else {
  console.log('Unknown command.');
  printUsage();
  process.exit(1);
}
