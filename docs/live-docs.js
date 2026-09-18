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
  const aliases = {
    '/.*/_sidebar.md': '/_sidebar.md',
  };
  const pages = livePages();

  Object.entries(pages).forEach(([pkg, entries]) => {
    Object.entries(entries).forEach(([key, page]) => {
      const spec = Array.isArray(page) ? { urls: page } : page;
      const url = spec.urls[0];
      if (!url) {
        return;
      }

      const busted = bust(url);
      if (!key) {
        aliases[`/${pkg}.md`] = busted;
        aliases[`/${pkg}/README.md`] = busted;
        return;
      }

      aliases[`/${pkg}/${key}.md`] = busted;
    });
  });

  return aliases;
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
  const hash = window.location.hash || '';
  if (!/[?&]s=/.test(hash)) {
    return;
  }
  const cleaned = hash
    .replace(/([?&])s=[^&]*/g, '$1')
    .replace(/\?&/g, '?')
    .replace(/[?&]$/, '')
    .replace(/\?$/, '');
  const next = window.location.pathname + window.location.search + cleaned;
  window.history.replaceState(null, '', next);
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
  const topbar = document.querySelector('.topbar');
  const header = document.querySelector('.main-header');
  const topbarHeight = topbar?.getBoundingClientRect().height || 0;
  const headerHeight = header?.getBoundingClientRect().height || 0;
  const root = document.documentElement;

  root.style.setProperty(
    '--pgpjs-topbar-height',
    `${Math.round(topbarHeight)}px`,
  );
  root.style.setProperty(
    '--pgpjs-chrome-height',
    `${Math.round(topbarHeight + headerHeight)}px`,
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
  document.querySelectorAll('[aria-controls="__sidebar"]').forEach(toggle => {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Show primary navigation');
  });
  document
    .querySelectorAll('[inert]')
    .forEach(el => el.removeAttribute('inert'));
}

function repairInertChrome() {
  document
    .querySelectorAll(
      '.pgpjs-docs-shell[inert], .topbar[inert], .main-header[inert], .sidebar-toggle[inert], .sidebar[inert]',
    )
    .forEach(el => el.removeAttribute('inert'));
}

function bindMobileSidebarClose() {
  if (document.body.dataset.sidebarCloseBound === '1') {
    return;
  }
  document.body.dataset.sidebarCloseBound = '1';

  new MutationObserver(repairInertChrome).observe(document.body, {
    attributes: true,
    subtree: true,
    attributeFilter: ['inert'],
  });

  document.addEventListener(
    'pointerdown',
    event => {
      const sidebar = document.querySelector('.sidebar.show');
      if (!sidebar || window.matchMedia('(min-width: 641px)').matches) {
        return;
      }
      if (event.target.closest('.sidebar-toggle')) {
        return;
      }
      if (sidebar.contains(event.target)) {
        return;
      }
      closeMobileSidebar();
    },
    true,
  );
}

function liveDocsPlugin(hook, vm) {
  hook.mounted(() => {
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

    const path = (vm.route.path || '/').replace(/\.md$/, '');
    const isHome = path === '/' || path === '/README' || path === '';
    const current = path.replace(/\/$/, '');
    document.body.classList.toggle('pgpjs-home', isHome);
    document.body.classList.toggle('pgpjs-docs', !isHome);
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

probeStandalone();

window.$pgpjs = window.$pgpjs || {};
window.$pgpjs.alias = Object.assign({}, aliasMap(), window.$pgpjs.alias);
window.$pgpjs.routes = Object.assign({}, window.$pgpjs.routes, {
  '/(core|next|react)/?(.*)': function livePackageRoute(route, matched, next) {
    const pkg = matched[1];
    const rest = (matched[2] || '')
      .replace(/\.md$/i, '')
      .replace(/\/+$/, '')
      .replace(/^README$/i, '');
    const page = livePages()[pkg]?.[rest];

    if (!page) {
      next();
      return;
    }

    const spec = Array.isArray(page) ? { urls: page } : page;

    fetchFirst(spec.urls).then(result => {
      if (!result) {
        next(
          `# ${pkg}\n\nCould not load live docs. Check GitHub availability for \`pgpjs/${pkg}\` or \`pgpjs/core\`.`,
        );
        return;
      }

      if (spec.code) {
        next(wrapCode(spec.code, result.text, result.url));
      } else {
        next(wrapMarkdown(result.text, result.url));
      }
    });
  },
});

window.$pgpjs.plugins = [liveDocsPlugin, ...(window.$pgpjs.plugins || [])];
