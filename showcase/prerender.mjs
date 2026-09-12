import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const dist = resolve('showcase-dist');
const { version } = JSON.parse(readFileSync(resolve('package.json'), 'utf8'));

/**
 * `lastmod` should say when the content changed, not when the build ran, so it
 * comes from the last commit: rebuilding the same commit yields a byte-identical
 * sitemap instead of a fresh timestamp that tells crawlers nothing. Falls back to
 * now when git isn't available (a tarball export, a non-repo checkout).
 */
const lastmod = (() => {
  try {
    const committed = execFileSync('git', ['log', '-1', '--format=%cI'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (committed) return committed;
  } catch {
    // fall through
  }
  return new Date().toISOString();
})();

const server = await import(pathToFileURL(resolve('showcase/.ssr/entry-server.js')).href);

const rendered = await server.render();
const { manifest, llmsTxt, sitemap } = server.artifacts(version, lastmod);

const shell = readFileSync(resolve(dist, 'index.html'), 'utf8');
writeFileSync(resolve(dist, 'index.html'), server.buildPage(shell, rendered));
writeFileSync(resolve(dist, 'components.json'), JSON.stringify(manifest, null, 2));
writeFileSync(resolve(dist, 'llms.txt'), llmsTxt);
writeFileSync(resolve(dist, 'sitemap.xml'), sitemap);

console.log(`Prerendered ${manifest.components.length} components.`);
