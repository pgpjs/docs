/**
 * Live PGPJS docs: fetch markdown and source from GitHub on each page load.
 * Prefers pgpjs/next and pgpjs/react when those repos exist; otherwise uses
 * packages inside pgpjs/core. Fetches with cache: 'no-store' so repository
 * changes appear on the next visit without rebuilding this site.
 */
const CORE_RAW = 'https://raw.githubusercontent.com/pgpjs/core/main';
const NEXT_RAW = 'https://raw.githubusercontent.com/pgpjs/next/main';
const REACT_RAW = 'https://raw.githubusercontent.com/pgpjs/react/main';
const CORE_JSDELIVR = 'https://cdn.jsdelivr.net/gh/pgpjs/core@main';
const NEXT_JSDELIVR = 'https://cdn.jsdelivr.net/gh/pgpjs/next@main';
const REACT_JSDELIVR = 'https://cdn.jsdelivr.net/gh/pgpjs/react@main';

const STANDALONE = { next: false, react: false };

function bust(url) {
  const t = Math.floor(Date.now() / 60000);
  return `${url}${url.includes('?') ? '&' : '?'}t=${t}`;
}

function probeStandalone() {
  [
    ['next', `${NEXT_RAW}/README.md`],
    ['react', `${REACT_RAW}/README.md`],
  ].forEach(([pkg, url]) => {
    fetch(url, { cache: 'no-store' })
      .then(response => {
        STANDALONE[pkg] = Boolean(response.ok);
      })
      .catch(() => {
        STANDALONE[pkg] = false;
      });
  });
}

function coreUrls(path) {
  return [`${CORE_RAW}/${path}`, `${CORE_JSDELIVR}/${path}`];
}

function packageUrls(pkg, repoPath, corePath) {
  const raw = pkg === 'next' ? NEXT_RAW : REACT_RAW;
  const cdn = pkg === 'next' ? NEXT_JSDELIVR : REACT_JSDELIVR;
  const urls = [];

  if (STANDALONE[pkg]) {
    urls.push(`${raw}/${repoPath}`, `${cdn}/${repoPath}`);
  }

  urls.push(`${CORE_RAW}/${corePath}`, `${CORE_JSDELIVR}/${corePath}`);
  return urls;
}

function livePages() {
  return {
    core: {
      '': coreUrls('README.md'),
      architecture: coreUrls('docs/ARCHITECTURE.md'),
      security: coreUrls('docs/SECURITY.md'),
      package: coreUrls('packages/core/README.md'),
      'code/pgpjs': {
        code: 'pgpjs.ts',
        urls: coreUrls('packages/core/src/highlevel/pgpjs.ts'),
      },
      'code/index': {
        code: 'index.ts',
        urls: coreUrls('packages/core/src/index.ts'),
      },
    },
    next: {
      '': packageUrls('next', 'README.md', 'packages/next/README.md'),
      'code/server': {
        code: 'server.ts',
        urls: packageUrls(
          'next',
          'src/server.ts',
          'packages/next/src/server.ts',
        ),
      },
      'code/client': {
        code: 'client.ts',
        urls: packageUrls(
          'next',
          'src/client.ts',
          'packages/next/src/client.ts',
        ),
      },
      'code/index': {
        code: 'index.ts',
        urls: packageUrls('next', 'src/index.ts', 'packages/next/src/index.ts'),
      },
    },
    react: {
      '': packageUrls('react', 'README.md', 'packages/react/README.md'),
      'code/hooks': {
        code: 'hooks.ts',
        urls: packageUrls(
          'react',
          'src/hooks.ts',
          'packages/react/src/hooks.ts',
        ),
      },
      'code/context': {
        code: 'context.tsx',
        urls: packageUrls(
          'react',
          'src/context.tsx',
          'packages/react/src/context.tsx',
        ),
      },
      'code/index': {
        code: 'index.ts',
        urls: packageUrls(
          'react',
          'src/index.ts',
          'packages/react/src/index.ts',
        ),
      },
    },
  };
}

function aliasMap() {
  return {
    '/(core|next|react|mpc|cli)/_sidebar.md': '/_sidebar.md',
    '/(core|next|react|mpc|cli)/.*/_sidebar.md': '/_sidebar.md',
    '/core': '/core/',
    '/next': '/next/',
    '/react': '/react/',
    '/mpc': '/mpc/',
  };
}

async function fetchFirst(urls) {
  for (const url of urls) {
    try {
      const response = await fetch(bust(url), { cache: 'no-store' });
      if (response.ok) {
        const text = await response.text();
        if (text && !text.startsWith('404:')) {
          return { text, url };
        }
      }
    } catch {
      // try the next source
    }
  }

  return null;
}

function languageFor(filename) {
  if (filename.endsWith('.tsx') || filename.endsWith('.ts')) {
    return 'typescript';
  }
  if (filename.endsWith('.js')) {
    return 'javascript';
  }
  return '';
}

function wrapCode(filename, source, url) {
  const lang = languageFor(filename);
  const fence = source.includes('```') ? '~~~~' : '```';
  return [
    `# \`${filename}\``,
    '',
    '<span class="live-badge">Live from GitHub</span>',
    '',
    'This page loads the current file from the repository. When the source changes on GitHub, this page updates on the next visit.',
    '',
    url ? `Source: [${url}](${url})` : '',
    '',
    fence + lang,
    source,
    fence,
    '',
  ].join('\n');
}

function rewriteRelativeUrls(text, sourceUrl) {
  if (!text || !sourceUrl) {
    return text;
  }

  let base;
  try {
    base = new URL('.', sourceUrl).href;
  } catch {
    return text;
  }

  return text.replace(
    /(!?\[[^\]]*]\()(?!https?:|\/\/|#|mailto:)([^)\s]+)(\))/g,
    (match, prefix, path, suffix) => {
      try {
        return `${prefix}${new URL(path, base).href}${suffix}`;
      } catch {
        return match;
      }
    },
  );
}

function wrapMarkdown(text, url) {
  const badge = `<span class="live-badge">Live from GitHub</span>\n\n`;
  const source = url ? `> Synced from \`${url}\`\n\n` : '';
  return badge + source + rewriteRelativeUrls(text, url);
}

function liveSpecFromUrl(url) {
  const raw = String(url || '').split('?')[0];
  let path = raw;
  try {
    path = new URL(raw, location.origin).pathname;
  } catch {
    path = raw;
  }
  const match = path.match(/\/(core|next|react)(?:\/(.*))?$/i);
  if (!match) {
    return null;
  }
  const pkg = match[1].toLowerCase();
  const rest = (match[2] || '')
    .replace(/\.md$/i, '')
    .replace(/\/+$/, '')
    .replace(/^README$/i, '');
  const page = livePages()[pkg]?.[rest];
  if (!page) {
    return null;
  }
  return Array.isArray(page) ? { urls: page } : page;
}

function renderLivePage(spec, result) {
  if (!result) {
    return '';
  }
  if (spec.code) {
    return wrapCode(spec.code, result.text, result.url);
  }
  return wrapMarkdown(result.text, result.url);
}

function patchDocsifyGet() {
  const docsify = window.Docsify;
  if (!docsify?.get || docsify.get.__pgpjsLive) {
    return;
  }
  const original = docsify.get.bind(docsify);
  function get(url, hasBar, headers) {
    const spec = liveSpecFromUrl(url);
    const orig = original(url, hasBar, headers);
    if (!spec) {
      return orig;
    }
    return {
      then(success, error) {
        const take = text => {
          if (
            text &&
            !isHtmlShell(text) &&
            String(text).trim() &&
            !/^404/.test(text)
          ) {
            success(text);
            return;
          }
          fetchFirst(spec.urls)
            .then(result => success(renderLivePage(spec, result) || text || ''))
            .catch(error);
        };
        if (orig && typeof orig.then === 'function') {
          orig.then(take, error);
        } else {
          take(orig);
        }
      },
      abort() {
        orig?.abort?.();
      },
    };
  }
  get.__pgpjsLive = true;
  docsify.get = get;
}

function decorateSearchInput(input) {
  if (!input) {
    return;
  }
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('autocorrect', 'off');
  input.setAttribute('autocapitalize', 'none');
  input.setAttribute('spellcheck', 'false');
  input.setAttribute('enterkeyhint', 'search');
}

function stripSearchQueryFromLocation() {
  const url = new URL(window.location.href);
  const hash = url.hash || '';
  let changed = false;
  if (url.searchParams.has('s')) {
    url.searchParams.delete('s');
    changed = true;
  }
  if (/[?&]s=/.test(hash)) {
    url.hash = hash
      .replace(/([?&])s=[^&]*/g, '$1')
      .replace(/\?&/g, '?')
      .replace(/[?&]$/, '')
      .replace(/\?$/, '');
    changed = true;
  }
  if (changed) {
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
  }
}

function hardenSearch() {
  const host = document.getElementById('pgpjs-search');
  if (!host) {
    return;
  }

  decorateSearchInput(host.querySelector('input[type="search"]'));

  if (host.dataset.searchHardened === '1') {
    return;
  }
  host.dataset.searchHardened = '1';

  const lockViewport = () => {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      return;
    }
    viewport.setAttribute(
      'content',
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, shrink-to-fit=no, viewport-fit=cover, interactive-widget=overlays-content',
    );
    if (window.visualViewport?.scale && window.visualViewport.scale !== 1) {
      window.scrollTo(0, 0);
    }
  };

  host.addEventListener('focusin', lockViewport, true);
  host.addEventListener('touchstart', lockViewport, {
    capture: true,
    passive: true,
  });

  const stopSubmit = event => {
    const input = event.target?.closest?.('input[type="search"]');
    if (!input || !host.contains(input)) {
      return;
    }
    if (event.type === 'keydown' && event.key !== 'Enter') {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    // Keep the typed query in the field. Do not write it to the URL or reload.
    stripSearchQueryFromLocation();
    input.blur();
  };

  host.addEventListener('keydown', stopSubmit, true);
  host.addEventListener('search', stopSubmit, true);
  host.addEventListener(
    'submit',
    event => {
      event.preventDefault();
      event.stopPropagation();
    },
    true,
  );
}

function relocateSearch() {
  const host = document.getElementById('pgpjs-search');
  const search =
    document.querySelector('#pgpjs-search .search') ||
    document.querySelector('.sidebar .search');
  if (!host || !search || search.parentElement === host) {
    hardenSearch();
    return;
  }

  host.querySelector('.search-input')?.remove();
  host.appendChild(search);
  hardenSearch();
}

function measureChrome() {
  const chrome = document.querySelector('.pgpjs-chrome');
  const topbar = document.querySelector('.topbar');
  const header = document.querySelector('.main-header');
  const topbarHeight = topbar?.getBoundingClientRect().height || 0;
  const headerHeight = header?.getBoundingClientRect().height || 0;
  const chromeHeight =
    chrome?.getBoundingClientRect().height || topbarHeight + headerHeight;
  const root = document.documentElement;

  root.style.setProperty(
    '--pgpjs-topbar-height',
    `${Math.round(topbarHeight)}px`,
  );
  root.style.setProperty(
    '--pgpjs-chrome-height',
    `${Math.round(chromeHeight)}px`,
  );
}

function refreshAliases(vm) {
  const aliases = aliasMap();
  window.$pgpjs.alias = Object.assign({}, aliases);
  if (vm?.config) {
    vm.config.alias = Object.assign({}, vm.config.alias, aliases);
  }
}

function isHtmlShell(text) {
  return /pgpjs-landing|<!doctype html/i.test(text || '');
}

function repairSidebar(vm) {
  const nav = document.querySelector('.sidebar-nav');
  if (!nav || !isHtmlShell(nav.innerHTML)) {
    return;
  }

  fetch('_sidebar.md', { cache: 'no-store' })
    .then(response => (response.ok ? response.text() : ''))
    .then(text => {
      if (!text || isHtmlShell(text) || !vm?.compiler?.sidebar) {
        return;
      }
      nav.innerHTML = vm.compiler.sidebar(text, vm.config.maxLevel);
    })
    .catch(() => {});
}

function closeMobileSidebar() {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar || !sidebar.classList.contains('show')) {
    return;
  }
  if (window.matchMedia('(min-width: 641px)').matches) {
    return;
  }
  sidebar.classList.remove('show');
  document.body.classList.remove('pgpjs-sidebar-open');
  document.querySelectorAll('[aria-controls="__sidebar"]').forEach(toggle => {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Show primary navigation');
  });
  document
    .querySelectorAll('[inert]')
    .forEach(el => el.removeAttribute('inert'));
  const backdrop = document.querySelector('.pgpjs-sidebar-backdrop');
  if (backdrop) {
    backdrop.hidden = true;
  }
}

function repairInertChrome() {
  document
    .querySelectorAll('[inert]')
    .forEach(el => el.removeAttribute('inert'));
}

function ensureSidebarBackdrop() {
  let backdrop = document.querySelector('.pgpjs-sidebar-backdrop');
  if (backdrop) {
    return backdrop;
  }
  backdrop = document.createElement('button');
  backdrop.type = 'button';
  backdrop.className = 'pgpjs-sidebar-backdrop';
  backdrop.hidden = true;
  backdrop.setAttribute('aria-label', 'Close navigation');
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', event => {
    event.preventDefault();
    closeMobileSidebar();
  });
  return backdrop;
}

function syncMobileSidebarUi() {
  const sidebar = document.querySelector('.sidebar');
  const open =
    Boolean(sidebar?.classList.contains('show')) &&
    window.matchMedia('(max-width: 640px)').matches;
  document.body.classList.toggle('pgpjs-sidebar-open', open);
  const backdrop = ensureSidebarBackdrop();
  backdrop.hidden = !open;
}

function observeSidebar() {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar || sidebar.dataset.sidebarObserved === '1') {
    return;
  }
  sidebar.dataset.sidebarObserved = '1';
  new MutationObserver(syncMobileSidebarUi).observe(sidebar, {
    attributes: true,
    attributeFilter: ['class'],
  });
  syncMobileSidebarUi();
}

function bindMobileSidebarClose() {
  if (document.body.dataset.sidebarCloseBound === '1') {
    observeSidebar();
    return;
  }
  document.body.dataset.sidebarCloseBound = '1';
  ensureSidebarBackdrop();
  observeSidebar();

  new MutationObserver(repairInertChrome).observe(document.body, {
    attributes: true,
    subtree: true,
    attributeFilter: ['inert'],
  });

  const closeIfOpen = event => {
    const sidebar = document.querySelector('.sidebar.show');
    if (!sidebar || window.matchMedia('(min-width: 641px)').matches) {
      return;
    }
    const onToggle = event.target.closest(
      '.sidebar-toggle, .sidebar-toggle-button, .pgpjs-sidebar-backdrop',
    );
    if (sidebar.contains(event.target) && !onToggle) {
      return;
    }
    if (onToggle) {
      event.preventDefault();
      event.stopPropagation();
    }
    closeMobileSidebar();
  };

  document.addEventListener('click', closeIfOpen, true);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeMobileSidebar();
    }
  });
}

function liveDocsPlugin(hook, vm) {
  hook.init(() => {
    patchDocsifyGet();
  });
  hook.mounted(() => {
    patchDocsifyGet();
    refreshAliases(vm);
    relocateSearch();
    measureChrome();
    repairSidebar(vm);
    bindMobileSidebarClose();
    let chromeWidth = window.innerWidth;
    window.addEventListener('resize', () => {
      // Ignore keyboard-driven visual-viewport resizes so the compact
      // header does not jump after typing in search.
      if (window.innerWidth === chromeWidth) {
        return;
      }
      chromeWidth = window.innerWidth;
      measureChrome();
    });
  });

  hook.doneEach(() => {
    refreshAliases(vm);
    relocateSearch();
    measureChrome();
    repairSidebar(vm);
    bindMobileSidebarClose();

    const path = (vm.route.path || '/').replace(/\.md$/, '');
    const isHome = path === '/' || path === '/README' || path === '';
    const current = path.replace(/\/$/, '');
    document.body.classList.toggle('pgpjs-home', isHome);
    document.body.classList.toggle('pgpjs-docs', !isHome);
    syncPageMeta(current || '/', isHome);
    document.querySelector('main > .content')?.scrollTo(0, 0);
    document
      .querySelector('.markdown-section')
      ?.classList.toggle('pgpjs-live-source', /\/code\//.test(current));

    document.querySelectorAll('.main-nav a[data-nav]').forEach(link => {
      const pkg = link.getAttribute('data-nav');
      const active =
        !isHome &&
        Boolean(pkg) &&
        (current === `/${pkg}` || current.startsWith(`/${pkg}/`));
      link.classList.toggle('active', active);
    });
    closeMobileSidebar();
  });
}

const HOME_TITLE =
  'PGPJS — Modern OpenPGP & Cryptography for JavaScript & Next.js';
const HOME_DESC =
  'PGPJS is a modern JavaScript toolkit for OpenPGP (RFC 9580). Install the CLI, then seal and open data in React, Next.js, and Node.';
const SITE_ORIGIN = 'https://pgpjs.org';

const PAGE_META = {
  '/overview': {
    title: 'Downloads — PGPJS CLI',
    description:
      'Install the PGPJS CLI and libraries. npm install -g pgpjs-cli on Windows, macOS, and Linux. Node.js 20.10 or newer.',
    markdown: '/overview.md',
  },
  '/quickstart': {
    title: 'Quick start — PGPJS',
    description:
      'Install pgpjs-cli, run pgpjs init, and seal data with @pgpjs/core in a TypeScript app.',
    markdown: '/quickstart.md',
  },
  '/cli/windows': {
    title: 'Install PGPJS CLI on Windows',
    description:
      'Install pgpjs-cli with npm in PowerShell on Windows 10 or 11. Node.js 20.10 or newer.',
    markdown: '/cli/windows.md',
  },
  '/cli/macos': {
    title: 'Install PGPJS CLI on macOS',
    description:
      'Install pgpjs-cli with npm in Terminal on Apple Silicon or Intel Macs. Node.js 20.10 or newer.',
    markdown: '/cli/macos.md',
  },
  '/mpc': {
    title: 'PGPJS MPC — threshold OpenPGP',
    description:
      'Multi-party computation for OpenPGP: split trust, threshold decrypt and sign, keep keys off a single machine.',
    markdown: '/mpc/README.md',
  },
  '/mpc/install': {
    title: 'Install PGPJS MPC',
    description: 'Install @pgpjs/mpc on macOS, Linux, or Windows with npm.',
    markdown: '/mpc/install.md',
  },
  '/core': {
    title: '@pgpjs/core — RFC 9580 engine',
    description:
      'PGPJS core library: generate RFC 9580 keys, seal and open data, TypeScript API for Node and the browser.',
    markdown: '/core/README.md',
  },
  '/core/architecture': {
    title: 'Architecture — @pgpjs/core',
    description:
      'How the PGPJS core engine is structured: keys, seal, open, and the RFC 9580 stack.',
    markdown: '/core/architecture.md',
  },
  '/core/security': {
    title: 'Security — @pgpjs/core',
    description:
      'PGPJS security model, defaults, and what the library will not do.',
    markdown: '/core/security.md',
  },
  '/core/package': {
    title: 'Package README — @pgpjs/core',
    description:
      'The @pgpjs/core package README: install, seal, open, and TypeScript types.',
    markdown: '/core/package.md',
  },
  '/core/code/pgpjs': {
    title: 'pgpjs.ts — @pgpjs/core',
    description: 'Live source for the PGPJS high-level seal and open API.',
    markdown: '/core/code/pgpjs.md',
  },
  '/core/code/index': {
    title: 'index.ts — @pgpjs/core',
    description: 'Live source for the @pgpjs/core public exports.',
    markdown: '/core/code/index.md',
  },
  '/next': {
    title: '@pgpjs/next — encrypted Next.js routes',
    description:
      'Next.js helpers for PGPJS: encrypted route handlers, server actions, and a client/server key split.',
    markdown: '/next/README.md',
  },
  '/next/code/server': {
    title: 'server.ts — @pgpjs/next',
    description: 'Live source for PGPJS Next.js server helpers.',
    markdown: '/next/code/server.md',
  },
  '/next/code/client': {
    title: 'client.ts — @pgpjs/next',
    description: 'Live source for PGPJS Next.js client helpers.',
    markdown: '/next/code/client.md',
  },
  '/next/code/index': {
    title: 'index.ts — @pgpjs/next',
    description: 'Live source for the @pgpjs/next public exports.',
    markdown: '/next/code/index.md',
  },
  '/react': {
    title: '@pgpjs/react — PGPProvider and hooks',
    description:
      'React bindings for PGPJS: PGPProvider, useKey, useEncryption, and hooks that never put private keys in the browser bundle by accident.',
    markdown: '/react/README.md',
  },
  '/react/code/hooks': {
    title: 'hooks.ts — @pgpjs/react',
    description: 'Live source for PGPJS React hooks.',
    markdown: '/react/code/hooks.md',
  },
  '/react/code/context': {
    title: 'context.tsx — @pgpjs/react',
    description: 'Live source for the PGPJS PGPProvider context.',
    markdown: '/react/code/context.md',
  },
  '/react/code/index': {
    title: 'index.ts — @pgpjs/react',
    description: 'Live source for the @pgpjs/react public exports.',
    markdown: '/react/code/index.md',
  },
  '/centraldb/cdci/git': {
    title: 'CentralDB CDCI — built with PGPJS',
    description:
      'CentralDB CDCI is an X11 chain. PGPJS seals the envelope before a commitment is anchored on CDCI.',
    markdown: '/centraldb/cdci/git.md',
  },
  '/crypterchat/chatscan/git': {
    title: 'CrypterChat ChatScan — built with PGPJS',
    description:
      'ChatScan is a block explorer for encrypted messages. PGPJS seals on the client; ChatScan never sees plaintext.',
    markdown: '/crypterchat/chatscan/git.md',
  },
  '/prysel/robotics-studio/git': {
    title: 'Prysel Robotics Studio — built with PGPJS',
    description:
      'Prysel Robotics Studio uses PGPJS to generate RFC 9580 keys and seal robot telemetry.',
    markdown: '/prysel/robotics-studio/git.md',
  },
  '/prysel/cli/git': {
    title: 'PGPJS CLI in Prysel Robotics Studio',
    description:
      'Install pgpjs-cli on the Prysel Robotics Studio bench and seal telemetry with the same OpenPGP toolkit.',
    markdown: '/prysel/cli/git.md',
  },
};

function setMeta(name, content, attr = 'name') {
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function markdownForPath(path) {
  if (PAGE_META[path]?.markdown) {
    return PAGE_META[path].markdown;
  }
  if (path === '/' || !path) {
    return null;
  }
  if (path.endsWith('/')) {
    return `${path}README.md`;
  }
  return `${path}.md`;
}

function setAlternateMarkdown(path) {
  let link = document.querySelector(
    'link[rel="alternate"][type="text/markdown"]',
  );
  const href = markdownForPath(path);
  if (!href) {
    link?.remove();
    return;
  }
  if (!link) {
    link = document.createElement('link');
    link.rel = 'alternate';
    link.type = 'text/markdown';
    document.head.appendChild(link);
  }
  link.setAttribute('href', `${SITE_ORIGIN}${href}`);
}

function setJsonLd(path, title, isHome) {
  let el = document.getElementById('pgpjs-breadcrumb-jsonld');
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = 'pgpjs-breadcrumb-jsonld';
    document.head.appendChild(el);
  }
  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'PGPJS',
      item: `${SITE_ORIGIN}/`,
    },
  ];
  if (!isHome) {
    items.push({
      '@type': 'ListItem',
      position: 2,
      name: title.replace(/ · PGPJS$/, ''),
      item: `${SITE_ORIGIN}${path}`,
    });
  }
  el.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  });
}

function syncPageMeta(path, isHome) {
  const section = document.querySelector('.markdown-section');
  const heading = section?.querySelector('h1');
  const paragraph = section?.querySelector('p');
  const known = PAGE_META[path] || PAGE_META[path.replace(/\/$/, '')];
  const rawTitle = isHome
    ? HOME_TITLE
    : known?.title || (heading?.textContent || 'Documentation').trim();
  const title = /pgpjs/i.test(rawTitle) ? rawTitle : `${rawTitle} · PGPJS`;
  const desc = isHome
    ? HOME_DESC
    : known?.description ||
      (paragraph?.textContent || HOME_DESC)
        .trim()
        .replace(/\s+/g, ' ')
        .slice(0, 180);
  const canonicalPath = isHome ? '/' : path.startsWith('/') ? path : `/${path}`;
  const url = `${SITE_ORIGIN}${canonicalPath === '/' ? '/' : canonicalPath}`;

  document.title = title;
  setMeta('description', desc);
  setMeta('og:title', title, 'property');
  setMeta('og:description', desc, 'property');
  setMeta('og:url', url, 'property');
  setMeta('twitter:title', title);
  setMeta('twitter:description', desc);
  setAlternateMarkdown(isHome ? '/' : path);
  setJsonLd(canonicalPath, title, isHome);

  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', url);
}

probeStandalone();

window.$pgpjs = window.$pgpjs || {};
window.$pgpjs.alias = Object.assign({}, aliasMap(), window.$pgpjs.alias);

window.$pgpjs.plugins = [liveDocsPlugin, ...(window.$pgpjs.plugins || [])];
