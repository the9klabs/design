// Checks the shape of the built package in dist/: one module and one stylesheet per component,
// the shared stylesheet without component rules, the full stylesheet holding everything once,
// and every component rule inside the `components` cascade layer. Run after `vite build`, the
// style bundle and the declarations; exits non-zero naming the first problems it finds.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const componentsSrc = join(root, 'src/components');

// The one cascade order, declared first in src/styles/index.css and repeated at the top of every
// stylesheet the package ships.
const LAYER_ORDER = readFileSync(join(root, 'src/styles/index.css'), 'utf8')
  .match(/^@layer ([^;{]+);/)?.[1]
  .split(',')
  .map((layer) => layer.trim());
if (LAYER_ORDER?.at(-1) !== 'components') {
  console.error(
    'check-dist: src/styles/index.css does not open with an order ending in components',
  );
  process.exit(1);
}
// At-rules a cascade layer changes nothing for, so they may sit outside `@layer components`.
const UNLAYERED_AT_RULES = new Set(['font-face', 'keyframes', '-webkit-keyframes', 'charset']);

const problems = [];
const fail = (message) => problems.push(message);
const read = (path) => readFileSync(path, 'utf8');
const rel = (path) => relative(root, path);

function kebab(name) {
  return name
    .replace(/^I9k/, 'i9k-')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/-+/g, '-')
    .toLowerCase();
}

function isOrderStatement(node) {
  return (
    node?.type === 'atrule' &&
    node.name === 'layer' &&
    node.nodes === undefined &&
    node.params
      .split(',')
      .map((layer) => layer.trim())
      .join(',') === LAYER_ORDER.join(',')
  );
}

function firstNode(css) {
  return postcss.parse(css).nodes.find((node) => node.type !== 'comment');
}

// The relative specifiers a built module imports, statically or as a side effect.
function importsOf(code) {
  const specifiers = [];
  const pattern = /(?:^|[;\n}])\s*(?:import|export)\s*(?:[^'";]*?\sfrom\s*)?['"]([^'"]+)['"]/g;
  for (const match of code.matchAll(pattern)) specifiers.push(match[1]);
  return specifiers.filter((specifier) => specifier.startsWith('.'));
}

// Every file reachable from a module through relative imports: [jsFiles, cssFiles].
function reachable(entry) {
  const js = new Set();
  const css = new Set();
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.pop();
    if (js.has(file)) continue;
    js.add(file);
    for (const specifier of importsOf(read(file))) {
      const target = resolve(dirname(file), specifier);
      if (!existsSync(target)) {
        fail(`${rel(file)} imports ${specifier}, which does not exist`);
      } else if (target.endsWith('.css')) {
        css.add(target);
      } else {
        queue.push(target);
      }
    }
  }
  return [js, css];
}

function filesUnder(dir, extension) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return filesUnder(path, extension);
    return path.endsWith(extension) ? [path] : [];
  });
}

const pkg = JSON.parse(read(join(root, 'package.json')));
const componentExport = pkg.exports?.['./components/*'];
const componentPath = (name) =>
  componentExport ? join(root, componentExport.import.replace('*', name)) : undefined;

// 1. The root entry leaves stylesheets to the consumer.
const indexJs = join(dist, 'index.js');
if (!existsSync(indexJs)) {
  fail('dist/index.js is missing');
} else {
  const cssImports = importsOf(read(indexJs)).filter((specifier) => specifier.endsWith('.css'));
  if (cssImports.length > 0) fail(`dist/index.js imports CSS: ${cssImports.join(', ')}`);
}

// 2 and 3. One module per component, bringing its own styles and those of what it renders.
if (!componentExport) fail('package.json exports has no "./components/*" entry');
const components = readdirSync(componentsSrc)
  .filter((file) => file.endsWith('.vue'))
  .map((file) => ({
    name: file.replace(/\.vue$/, ''),
    source: read(join(componentsSrc, file)),
  }));
const componentCss = new Map();

for (const { name, source } of components) {
  const modulePath = componentPath(name);
  if (!modulePath || !existsSync(modulePath)) {
    fail(`${name} has no module at the "./components/*" export (${modulePath && rel(modulePath)})`);
    continue;
  }
  const [, css] = reachable(modulePath);
  componentCss.set(name, css);
  if (!/<style[\s>]/.test(source)) continue;
  if (css.size === 0) {
    fail(`${rel(modulePath)} reaches no stylesheet, but ${name}.vue has a <style> block`);
    continue;
  }
  const rootClass = `.${kebab(name)}`;
  const template = source.match(/<template>([\s\S]*)<\/template>/)?.[1] ?? '';
  if (template.includes(rootClass.slice(1))) {
    const holds = [...css].some((file) => read(file).includes(rootClass));
    if (!holds) fail(`no stylesheet ${rel(modulePath)} reaches holds ${rootClass}`);
  }
}

for (const { name, source } of components) {
  const own = componentCss.get(name);
  if (!own) continue;
  // Value imports only: `import type { … } from './I9kNavigation.vue'` renders nothing.
  const rendered = [
    ...source.matchAll(/^import\s+(?!type\s)[^;]*?from\s+['"]\.\/(I9k\w+)\.vue['"]/gm),
  ].map((m) => m[1]);
  for (const child of rendered) {
    const childCss = componentCss.get(child) ?? new Set();
    const missing = [...childCss].filter((file) => !own.has(file));
    if (missing.length > 0) {
      fail(
        `${name} renders ${child}, but its module does not reach ${missing.map(rel).join(', ')}`,
      );
    }
  }
}

// 4. The shared stylesheet: no component rule, and the cascade order first.
const baseCss = join(dist, 'base.css');
if (!existsSync(baseCss)) {
  fail('dist/base.css is missing');
} else {
  const css = read(baseCss);
  if (css.includes('[data-v-')) fail('dist/base.css holds a scoped component rule ([data-v-…])');
  if (!isOrderStatement(firstNode(css))) {
    fail(`dist/base.css does not start with @layer ${LAYER_ORDER.join(', ')};`);
  }
}

// 7. Every component stylesheet: the order statement, then its rules in `@layer components`.
const componentStylesheets = filesUnder(dist, '.css').filter(
  (file) => file !== baseCss && file !== join(dist, 'index.css'),
);
for (const file of componentStylesheets) {
  const nodes = postcss.parse(read(file)).nodes.filter((node) => node.type !== 'comment');
  if (!isOrderStatement(nodes[0])) {
    fail(`${rel(file)} does not open with @layer ${LAYER_ORDER.join(', ')};`);
  }
  const stray = nodes
    .slice(1)
    .filter(
      (node) =>
        !(node.type === 'atrule' && UNLAYERED_AT_RULES.has(node.name)) &&
        !(
          node.type === 'atrule' &&
          node.name === 'layer' &&
          node.params === 'components' &&
          node.nodes
        ),
    );
  if (stray.length > 0) {
    const sample =
      stray[0].type === 'rule' ? stray[0].selector : `@${stray[0].name} ${stray[0].params}`;
    fail(`${rel(file)} has ${stray.length} rule(s) outside @layer components, first: ${sample}`);
  }
}

// 5. The full stylesheet: the shared one and every component one, each exactly once.
const indexCss = join(dist, 'index.css');
if (!existsSync(indexCss)) {
  fail('dist/index.css is missing');
} else {
  const full = read(indexCss);
  for (const file of [baseCss, ...componentStylesheets].filter(existsSync)) {
    const part = read(file).trim();
    const count = part.length === 0 ? 0 : full.split(part).length - 1;
    if (count !== 1) fail(`dist/index.css holds ${rel(file)} ${count} times, not once`);
  }
}

// 6. Every path the exports map names exists.
function exportTargets(value) {
  if (typeof value === 'string') return [value];
  if (value && typeof value === 'object') return Object.values(value).flatMap(exportTargets);
  return [];
}
for (const [key, value] of Object.entries(pkg.exports ?? {})) {
  for (const target of exportTargets(value)) {
    const paths = target.includes('*')
      ? components.map(({ name }) => target.replace('*', name))
      : [target];
    for (const path of paths) {
      if (!existsSync(join(root, path)))
        fail(`exports["${key}"] names ${path}, which does not exist`);
    }
  }
}

if (problems.length > 0) {
  console.error(`check-dist: ${problems.length} problem(s) in dist/`);
  for (const problem of problems.slice(0, 40)) console.error(`  - ${problem}`);
  if (problems.length > 40) console.error(`  … and ${problems.length - 40} more`);
  process.exit(1);
}

console.log(
  `check-dist: ${components.length} components, each with its own module and stylesheet; ` +
    `base.css and index.css in order`,
);
