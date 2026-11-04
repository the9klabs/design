/// <reference types="vitest/config" />

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { injectChunkCss } from './build/inject-chunk-css.ts';
import { componentsLayer } from './build/postcss-components-layer.ts';

const rootDir = dirname(fileURLToPath(import.meta.url));

// A component's stylesheet is named after its module (`components/I9kButton.css` beside
// `components/I9kButton.js`); the shared one is `base.css`.
function cssBesideItsModule(asset: { names: string[]; originalFileNames: string[] }) {
  const source = asset.originalFileNames[0] ?? '';
  const style = source.match(/^src\/(.+)\.vue\?vue&type=style&index=(\d+)/);
  if (style) return `${style[1]}${style[2] === '0' ? '' : `-${style[2]}`}.css`;
  if (asset.names[0] === 'base.css') return 'base.css';
  return 'assets/[name]-[hash][extname]';
}

export default defineConfig({
  plugins: [vue(), injectChunkCss()],
  css: {
    // Every component's styles sit in the `components` cascade layer (build/postcss-components-layer.ts).
    postcss: { plugins: [componentsLayer()] },
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    alias: {
      // The docs theme's DocsColorTokens.vue imports the `virtual:showcase-data` module that
      // showcase/vite-plugin-data.ts resolves under VitePress. That plugin isn't part of this
      // config, so under Vitest the id would otherwise fail to resolve. Alias it to a minimal
      // fixture so a test can mount a docs component without the build-time extraction pipeline.
      'virtual:showcase-data': resolve(rootDir, 'tests/fixtures/virtualShowcaseData.ts'),
    },
  },
  build: {
    assetsInlineLimit: 0,
    // One stylesheet per module rather than one for the whole package.
    cssCodeSplit: true,
    // Left to the consumer's bundler, so each file keeps its `@layer` order statement whole.
    cssMinify: false,
    lib: {
      // `base` is the shared stylesheet: everything but the components.
      entry: {
        index: resolve(rootDir, 'src/index.ts'),
        base: resolve(rootDir, 'src/styles/index.css'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: { vue: 'Vue' },
        // One module per source file, so a consumer imports one component and its styles alone.
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
        assetFileNames: cssBesideItsModule,
      },
    },
  },
});
