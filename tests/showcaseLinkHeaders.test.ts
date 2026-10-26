import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { MACHINE_PATHS, SITE_URL } from '../showcase/site/config';

// Cloudflare Pages reads `_headers` from the build output root and applies it to
// responses; VitePress copies it there from `showcase/pages/public/`. It is config, never
// served, so the only way it can be wrong is silently.
const text = readFileSync(resolve('showcase/pages/public/_headers'), 'utf8');

/**
 * Link relation types this file is allowed to use, each registered in the IANA
 * Link Relations registry. An unregistered token (`sitemap`, say) has no agreed
 * meaning, so an agent cannot act on it; extension relations must be full URIs.
 */
const REGISTERED_RELATIONS = new Set(['canonical', 'service-desc', 'service-doc', 'describedby']);

/** URLs the site always serves, so a link cannot point at something absent. */
const KNOWN_PATHS = new Set<string>(['/', ...MACHINE_PATHS, '/sitemap.xml']);

interface Rule {
  pattern: string;
  headers: { name: string; value: string }[];
}

/** Parses the `[url]` / indented `[name]: [value]` shape Pages defines. */
function parseHeadersFile(input: string): Rule[] {
  const rules: Rule[] = [];

  for (const rawLine of input.split('\n')) {
    if (rawLine.trim() === '' || rawLine.trim().startsWith('#')) continue;

    const indented = /^\s/.test(rawLine);
    if (!indented) {
      rules.push({ pattern: rawLine.trim(), headers: [] });
      continue;
    }

    const line = rawLine.trim();
    const separator = line.indexOf(':');
    expect(separator, `header line is not "name: value": ${rawLine}`).toBeGreaterThan(0);
    expect(rules.length, `header line before any URL pattern: ${rawLine}`).toBeGreaterThan(0);
    rules[rules.length - 1].headers.push({
      name: line.slice(0, separator).trim(),
      value: line.slice(separator + 1).trim(),
    });
  }

  return rules;
}

interface LinkValue {
  target: string;
  params: Record<string, string>;
}

/**
 * Splits an RFC 8288 field value into its members and pulls each one apart.
 * Members are comma-separated, but a comma may also appear inside a quoted
 * parameter, so the split anchors on the `<` that opens the next target.
 */
function parseLinkHeader(value: string): LinkValue[] {
  return value.split(/,(?=\s*<)/).map((member) => {
    const match = /^\s*<([^>]*)>\s*(.*)$/.exec(member);
    expect(match, `link member is not "<target>; params": ${member}`).not.toBeNull();

    const params: Record<string, string> = {};
    for (const part of match![2].split(';')) {
      if (part.trim() === '') continue;
      const eq = part.indexOf('=');
      expect(eq, `link parameter is not "name=value": ${part}`).toBeGreaterThan(0);
      const name = part.slice(0, eq).trim().toLowerCase();
      params[name] = part
        .slice(eq + 1)
        .trim()
        .replace(/^"(.*)"$/, '$1');
    }

    return { target: match![1], params };
  });
}

const rules = parseHeadersFile(text);
const linkRules = rules.filter((rule) => rule.headers.some((header) => header.name === 'Link'));

describe('showcase _headers', () => {
  it('parses into rules that each carry at least one header', () => {
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) {
      expect(rule.pattern.startsWith('/') || rule.pattern.startsWith('http')).toBe(true);
      expect(rule.headers.length).toBeGreaterThan(0);
    }
  });

  it('serves a Link header on the homepage, which is what agents fetch first', () => {
    const home = rules.find((rule) => rule.pattern === '/');
    expect(home, 'no rule for "/"').toBeDefined();
    expect(home!.headers.filter((header) => header.name === 'Link')).toHaveLength(1);
  });

  it('gives / and /index.html identical headers, since both serve the same page', () => {
    const home = rules.find((rule) => rule.pattern === '/');
    const index = rules.find((rule) => rule.pattern === '/index.html');
    expect(index, 'no rule for "/index.html"').toBeDefined();
    expect(index!.headers).toEqual(home!.headers);
  });
});

describe('showcase Link headers', () => {
  const members = linkRules.flatMap((rule) =>
    rule.headers
      .filter((header) => header.name === 'Link')
      .flatMap((header) => parseLinkHeader(header.value)),
  );

  it('gives every member a target and a rel', () => {
    expect(members.length).toBeGreaterThan(0);
    for (const member of members) {
      expect(member.target).not.toBe('');
      expect(member.params.rel, `no rel on <${member.target}>`).toBeTruthy();
    }
  });

  it('uses only IANA-registered relation types', () => {
    for (const { params, target } of members) {
      // RFC 8288 section 3.3: a relation is either a registered token or a URI.
      const isUri = params.rel.includes(':');
      expect(
        isUri || REGISTERED_RELATIONS.has(params.rel),
        `unregistered rel "${params.rel}" on <${target}>`,
      ).toBe(true);
    }
  });

  it('targets either an absolute URL or an absolute path that the site serves', () => {
    for (const { target } of members) {
      if (target.startsWith('http')) {
        expect(() => new URL(target)).not.toThrow();
        continue;
      }
      expect(target.startsWith('/'), `relative target <${target}>`).toBe(true);
      expect(KNOWN_PATHS.has(target), `<${target}> is not a URL the site serves`).toBe(true);
    }
  });

  it('points canonical at the same origin the sitemap and robots.txt use', () => {
    // _headers is static and cannot import SITE_URL, so this is the seam where
    // a domain change would leave a stale canonical behind.
    const canonical = members.filter((member) => member.params.rel === 'canonical');
    expect(canonical).toHaveLength(2); // "/" and "/index.html"
    for (const member of canonical) expect(member.target).toBe(`${SITE_URL}/`);
  });

  it('advertises the machine-readable description and the prose description', () => {
    const home = linkRules.find((rule) => rule.pattern === '/')!;
    const byRel = Object.fromEntries(
      parseLinkHeader(home.headers.find((header) => header.name === 'Link')!.value).map(
        (member) => [member.params.rel, member],
      ),
    );

    expect(byRel['service-desc']?.target).toBe('/components.json');
    expect(byRel['service-desc']?.params.type).toBe('application/json');
    expect(byRel['describedby']?.target).toBe('/llms.txt');
    expect(byRel['describedby']?.params.type).toBe('text/plain');
  });

  it('links the machine-readable mirrors back to the human-readable page', () => {
    for (const path of ['/components.json', '/llms.txt']) {
      const rule = linkRules.find((candidate) => candidate.pattern === path);
      expect(rule, `no Link header for ${path}`).toBeDefined();
      const [member] = parseLinkHeader(rule!.headers.find((h) => h.name === 'Link')!.value);
      expect(member.params.rel).toBe('service-doc');
      expect(member.target).toBe('/');
    }
  });
});
