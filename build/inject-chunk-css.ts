import { dirname, relative } from 'node:path/posix';
import type { Plugin } from 'vite';

// The leading run of a chunk's static imports, with the comments and blank lines between them.
const LEADING_IMPORTS = /^(?:\s+|\/\*[\s\S]*?\*\/|\/\/[^\n]*|import\b[^;]*;)*/;

function endOfImports(code: string) {
  const leading = LEADING_IMPORTS.exec(code)?.[0] ?? '';
  const lastImport = [...leading.matchAll(/import\b[^;]*;/g)].at(-1);
  return lastImport ? lastImport.index + lastImport[0].length : 0;
}

// Vite's library mode writes each chunk's stylesheet beside it but leaves the chunk unaware of
// it. This makes every chunk import its own stylesheets, so importing a component brings its
// styles and the consumer's bundler emits them as ordinary same-origin `.css` files.
//
// The imports go after the chunk's other imports, where the SFC imported its style block: a
// component's stylesheet then follows those of the components it renders, the order the single
// stylesheet always had, so a parent's `:deep()` rule still wins a tie with its child's own.
export function injectChunkCss(): Plugin {
  let isLibrary = false;

  return {
    name: 'i9k-inject-chunk-css',
    apply: 'build',
    enforce: 'post',
    configResolved(config) {
      isLibrary = !!config.build.lib;
    },
    generateBundle: {
      // After vite:css-post has filled `importedCss` and dropped the CSS-only chunks.
      order: 'post',
      handler(_options, bundle) {
        if (!isLibrary) return;

        for (const chunk of Object.values(bundle)) {
          if (chunk.type !== 'chunk') continue;
          const css = [...(chunk.viteMetadata?.importedCss ?? [])];
          if (css.length === 0) continue;

          const imports = css.map((file) => {
            const path = relative(dirname(chunk.fileName), file);
            return `\nimport ${JSON.stringify(path.startsWith('.') ? path : `./${path}`)};`;
          });
          const at = endOfImports(chunk.code);
          chunk.code = chunk.code.slice(0, at) + imports.join('') + chunk.code.slice(at);
        }
      },
    },
  };
}
