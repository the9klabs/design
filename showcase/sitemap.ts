import { SITE_URL } from './site/config';

const XML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  "'": '&apos;',
  '"': '&quot;',
  '>': '&gt;',
  '<': '&lt;',
};

/** Entity-escaping required of every `<loc>` by sitemaps.org. */
const escapeXml = (value: string): string =>
  value.replace(/[&'"><]/g, (character) => XML_ENTITIES[character]);

/**
 * Renders the sitemap for `paths` (see `sitePaths` in site/config.ts).
 *
 * `lastmod` is supplied by the caller rather than read from the clock here, so
 * the function stays pure and rebuilding the same commit yields identical XML.
 * It must be a W3C datetime — `YYYY-MM-DD` or a full ISO 8601 timestamp.
 *
 * `changefreq` and `priority` are intentionally omitted: they are optional in
 * the protocol and ignored by every major crawler, so emitting them would add
 * bytes and a second thing to keep honest without buying anything.
 */
export const buildSitemap = (paths: readonly string[], lastmod: string): string => {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];

  for (const path of paths) {
    lines.push(
      '  <url>',
      `    <loc>${escapeXml(`${SITE_URL}${path}`)}</loc>`,
      `    <lastmod>${escapeXml(lastmod)}</lastmod>`,
      '  </url>',
    );
  }

  lines.push('</urlset>', '');
  return lines.join('\n');
};
