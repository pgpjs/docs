import prism from 'prismjs';
import { marked as _marked } from 'marked';
import * as util from './util/index.js';
import * as dom from './util/dom.js';
import { Compiler } from './render/compiler.js';
import { slugify } from './render/slugify.js';
import { get } from './util/ajax.js';
import { DocsifyConfig } from './config.js';
import { Docsify } from './Docsify.js';

type DocsifyConfigOrFn =
  | Partial<DocsifyConfig>
  | (Partial<DocsifyConfig> & ((config: Docsify) => Partial<DocsifyConfig>));

declare global {
  interface Window {
    $docsify?: DocsifyConfigOrFn;
    $pgpjs?: DocsifyConfigOrFn;

    Docsify: {
      util: typeof util;
      dom: typeof dom;
      get: typeof get;
      slugify: typeof slugify;
      version: string;
    };
    PGPJS: Window['Docsify'];
    DocsifyCompiler: typeof Compiler;
    PGPJSCompiler: typeof Compiler;
    marked: typeof _marked;
    Prism: typeof prism;
    Vue: any; // TODO Get Vue types and apply them here

    __current_docsify_compiler__?: Compiler;
  }

  const $docsify: Window['$docsify'];
  const $pgpjs: Window['$pgpjs'];

  const Docsify: Window['Docsify'];
  const PGPJS: Window['PGPJS'];
  const DocsifyCompiler: Window['DocsifyCompiler'];
  const PGPJSCompiler: Window['PGPJSCompiler'];
  const marked: Window['marked'];
  // @ts-expect-error Prism types are wonky
  const Prism: Window['Prism'];
  const Vue: Window['Vue'];
}
