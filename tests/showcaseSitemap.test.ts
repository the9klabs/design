import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { MACHINE_PATHS, SITE_URL, sitePaths } from '../showcase/site/config';
import { buildSitemap } from '../showcase/sitemap';

// A fixed set of pages, so these tests check the XML rather than the site's current contents;
// tests/showcaseSite.test.ts checks that the real sitemap lists every page.
const SITE_PAGES = sitePaths(['/', '/components', '/components/button']);

const LASTMOD = '2026-09-01T16:24:03+03:00';
const xml = buildSitemap(SITE_PAGES, LASTMOD);

/** All `<loc>` values, in document order. */
const locs = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) => match[1]);

describe('showcase sitemap', () => {
  it('declares the XML prolog and the sitemaps.org namespace', () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n')).toBe(true);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml.endsWith('</urlset>\n')).toBe(true);
  });

  it('parses as well-formed XML', () => {
    const parsed = new DOMParser().parseFromString(xml, 'application/xml');
    expect(parsed.querySelector('parsererror')).toBeNull();
    expect(parsed.documentElement.tagName).toBe('urlset');
    expect(parsed.documentElement.namespaceURI).toBe('http://www.sitemaps.org/schemas/sitemap/0.9');
    expect(parsed.getElementsByTagName('url')).toHaveLength(SITE_PAGES.length);
  });

  it('lists one <url> per site page, each with a loc and a lastmod', () => {
    expect(locs).toHaveLength(SITE_PAGES.length);
    expect([...xml.matchAll(/<url>/g)]).toHaveLength(SITE_PAGES.length);
    expect([...xml.matchAll(/<lastmod>/g)]).toHaveLength(SITE_PAGES.length);
  });

  it('emits absolute, same-origin, non-duplicated canonical URLs', () => {
    // Cross-origin entries are rejected by crawlers, and a duplicate <loc> makes
    // the sitemap self-contradicting about what is canonical.
    expect(new Set(locs).size).toBe(locs.length);
    for (const loc of locs) {
      expect(() => new URL(loc)).not.toThrow();
      expect(new URL(loc).origin).toBe(new URL(SITE_URL).origin);
    }
    expect(locs).toEqual(SITE_PAGES.map((path) => `${SITE_URL}${path}`));
  });

  it('lists the machine-readable files after the pages', () => {
    expect(locs.slice(-MACHINE_PATHS.length)).toEqual(
      MACHINE_PATHS.map((path) => `${SITE_URL}${path}`),
    );
  });

  it('never lists the sitemap or robots.txt as content', () => {
    for (const loc of locs) {
      expect(loc).not.toMatch(/\/sitemap\.xml$/);
      expect(loc).not.toMatch(/\/robots\.txt$/);
    }
  });

  it('carries the caller-supplied lastmod as a W3C datetime', () => {
    for (const [, value] of xml.matchAll(/<lastmod>([^<]*)<\/lastmod>/g)) {
      expect(value).toBe(LASTMOD);
      expect(value).toMatch(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2}))?$/);
      expect(Number.isNaN(Date.parse(value))).toBe(false);
    }
  });

  it('is pure: the same inputs render byte-identical XML', () => {
    expect(buildSitemap(SITE_PAGES, LASTMOD)).toBe(xml);
  });

  it('escapes XML reserved characters', () => {
    // Page paths hold no reserved characters, so drive the escaper through
    // the caller-supplied lastmod rather than leaving it untested.
    const escaped = buildSitemap(SITE_PAGES, `2026-01-01<&">'`);
    expect(escaped).toContain('<lastmod>2026-01-01&lt;&amp;&quot;&gt;&apos;</lastmod>');
    // Every surviving ampersand must open a real entity reference.
    expect(escaped).not.toMatch(/&(?!(amp|lt|gt|quot|apos);)/);
    expect(
      new DOMParser().parseFromString(escaped, 'application/xml').querySelector('parsererror'),
    ).toBeNull();
  });
});

describe('sitemap and robots.txt agree', () => {
  const robots = readFileSync(resolve('showcase/pages/public/robots.txt'), 'utf8');
  const declared = [...robots.matchAll(/^\s*Sitemap:\s*(\S+)\s*$/gim)].map((match) => match[1]);

  it('advertises exactly one sitemap, at the generated location', () => {
    // The generator writes showcase-dist/sitemap.xml from SITE_URL while
    // robots.txt is a static file that cannot import it, so this is the seam
    // where the two can silently drift apart.
    expect(declared).toEqual([`${SITE_URL}/sitemap.xml`]);
  });

  it('keeps every sitemap URL crawlable rather than disallowed', () => {
    const disallowed = [...robots.matchAll(/^\s*Disallow:\s*(\S+)\s*$/gim)].map(
      (match) => match[1],
    );
    for (const loc of locs) {
      const path = new URL(loc).pathname;
      for (const rule of disallowed) expect(path.startsWith(rule)).toBe(false);
    }
  });
});
