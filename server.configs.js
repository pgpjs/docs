import * as path from 'node:path';
import * as url from 'node:url';
import { rewriteRules } from './middleware.js';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Serve index.html for extensionless paths so history-mode deep links work locally. */
export function spaFallback(req, res, next) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    next();
    return;
  }

  const pathOnly = (req.url || '/').split('?')[0];
  if (
    pathOnly.startsWith('/browser-sync/') ||
    pathOnly.startsWith('/dist/') ||
    pathOnly.startsWith('/node_modules/')
  ) {
    next();
    return;
  }

  const query =
    (req.url || '').indexOf('?') >= 0
      ? req.url.slice(req.url.indexOf('?'))
      : '';

  if (/^\/(core|next|react|mpc|cli)(\/.*)?\/_sidebar\.md$/.test(pathOnly)) {
    req.url = `/_sidebar.md${query}`;
    next();
    return;
  }

  const basename = pathOnly.split('/').filter(Boolean).pop() || '';
  if (basename.includes('.')) {
    next();
    return;
  }

  req.url = `/index.html${query}`;
  next();
}

// Production (CDN URLs, watch disabled)
export const prodConfig = {
  ghostMode: false,
  hostname: '127.0.0.1',
  notify: false,
  open: false,
  port: 8080,
  rewriteRules,
  server: {
    baseDir: './docs',
    middleware: [spaFallback],
    routes: {
      '/changelog.md': path.resolve(__dirname, 'CHANGELOG.md'),
      '/dist': path.resolve(__dirname, 'dist'),
    },
  },
  snippet: false,
  ui: false,
};

// Development (local URLs, watch enabled)
export const devConfig = {
  ...prodConfig,
  files: ['CHANGELOG.md', 'docs/**/*', 'dist/**/*'],
  port: 3000,
  rewriteRules,
  reloadDebounce: 1000,
  reloadOnRestart: true,
  server: {
    ...prodConfig.server,
    routes: {
      '/changelog.md': path.resolve(__dirname, 'CHANGELOG.md'),
      '/dist': path.resolve(__dirname, 'dist'),
      '/node_modules': path.resolve(__dirname, 'node_modules'), // Required for automated Vue tests
    },
  },
  snippet: true,
};

// Test (local URLs, watch disabled)
export const testConfig = {
  ...devConfig,
  port: 4000,
  server: {
    ...devConfig.server,
    middleware: [
      spaFallback,
      // Blank page required for test environment
      {
        route: '/_blank.html',
        handle(req, res, next) {
          res.setHeader('Content-Type', 'text/html');
          res.end('<!DOCTYPE html><html><body></body></html>');
          next();
        },
      },
    ],
  },
  snippet: false,
  watch: false,
};
