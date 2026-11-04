// Writes dist/index.css, the `@9klabs/design/style.css` export: the shared stylesheet followed by
// every component's, so a consumer that loads the whole package keeps one file holding every
// style it has. The components come in the order a bundler meets their stylesheets importing
// dist/index.js (a component's after those of the components it renders), the order the single
// stylesheet had before the per-component build; any the root entry does not reach follow,
// sorted by path. Either way the order is stable from one build to the next.

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { relativeImports } from './module-imports.mjs';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const base = join(dist, 'base.css');
const full = join(dist, 'index.css');

// Stylesheets in the order evaluating `entry` meets them: each module's imports, in order.
function stylesheetsReachedFrom(entry) {
  const visited = new Set();
  const order = [];
  const visit = (file) => {
    if (visited.has(file)) return;
    visited.add(file);
    if (file.endsWith('.css')) {
      order.push(file);
      return;
    }
    for (const specifier of relativeImports(readFileSync(file, 'utf8'))) {
      visit(resolve(dirname(file), specifier));
    }
  };
  visit(entry);
  return order;
}

function stylesheetsUnder(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return stylesheetsUnder(path);
    return path.endsWith('.css') && path !== base && path !== full ? [path] : [];
  });
}

const all = stylesheetsUnder(dist);
const reached = stylesheetsReachedFrom(join(dist, 'index.js')).filter((file) => all.includes(file));
const rest = all
  .filter((file) => !reached.includes(file))
  .sort((a, b) => (relative(dist, a) < relative(dist, b) ? -1 : 1));
const components = [...reached, ...rest];
// Each component file keeps its own `@layer …;` order statement, so index.css repeats it once per
// component on purpose: every part stays byte-for-byte the file it came from.
const parts = [base, ...components].map((file) => readFileSync(file, 'utf8').trim());

writeFileSync(full, `${parts.join('\n\n')}\n`);
console.log(
  `build-style-bundle: dist/index.css holds base.css and ${components.length} components`,
);
