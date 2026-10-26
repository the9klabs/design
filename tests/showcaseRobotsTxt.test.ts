import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

// The showcase is a static VitePress build, so `showcase/pages/public/` is the only source
// for files that must appear verbatim at the site root. Cloudflare Pages serves
// `.txt` from there as `text/plain` with a 200, which is what RFC 9309 asks of
// `/robots.txt`. If this file moves or is dropped, crawlers get a 404 instead —
// hence the guard.
const source = resolve('showcase/pages/public/robots.txt');
const text = readFileSync(source, 'utf8');

/** One `User-agent:` run plus the rules that follow it, per RFC 9309 section 2.2.1. */
interface Group {
  agents: string[];
  rules: { field: string; value: string }[];
}

/** Non-group fields (RFC 9309 section 2.2.2) live outside any group. */
const NON_GROUP_FIELDS = new Set(['sitemap']);

function parseRobots(input: string): { groups: Group[]; sitemaps: string[] } {
  const groups: Group[] = [];
  const sitemaps: string[] = [];
  let current: Group | null = null;
  let expectingAgents = false;

  for (const rawLine of input.split('\n')) {
    const line = rawLine.split('#')[0].trim();
    if (line === '') continue;

    const separator = line.indexOf(':');
    expect(separator, `line is not a "field: value" pair: ${rawLine}`).toBeGreaterThan(0);

    const field = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();

    if (field === 'user-agent') {
      // Consecutive User-agent lines share one rule set; a User-agent line after
      // a rule starts a new group.
      if (!current || !expectingAgents) {
        current = { agents: [], rules: [] };
        groups.push(current);
        expectingAgents = true;
      }
      current.agents.push(value);
      continue;
    }

    if (NON_GROUP_FIELDS.has(field)) {
      // A non-group field may appear anywhere and belongs to no group, so it
      // must not close or join the group being parsed.
      if (field === 'sitemap') sitemaps.push(value);
      continue;
    }

    expect(current, `rule "${field}" appears before any User-agent line`).not.toBeNull();
    expectingAgents = false;
    current!.rules.push({ field, value });
  }

  return { groups, sitemaps };
}

const { groups, sitemaps } = parseRobots(text);

describe('showcase robots.txt', () => {
  it('is plain ASCII with LF endings and a trailing newline', () => {
    expect(text).not.toMatch(/\r/);
    expect(text.startsWith('﻿')).toBe(false);
    expect(text.endsWith('\n')).toBe(true);
    // eslint-disable-next-line no-control-regex
    expect(text).not.toMatch(/[^\x00-\x7f]/);
  });

  it('declares at least one group, each with a User-agent and a rule', () => {
    expect(groups.length).toBeGreaterThan(0);
    for (const group of groups) {
      expect(group.agents.length).toBeGreaterThan(0);
      expect(group.rules.length).toBeGreaterThan(0);
    }
  });

  it('uses only allow/disallow rules, with absolute paths or an empty value', () => {
    for (const { field, value } of groups.flatMap((group) => group.rules)) {
      expect(['allow', 'disallow']).toContain(field);
      if (value !== '') expect(value.startsWith('/')).toBe(true);
    }
  });

  it('has a catch-all group that leaves the whole site crawlable', () => {
    const wildcard = groups.find((group) => group.agents.includes('*'));
    expect(wildcard, 'no "User-agent: *" group').toBeDefined();

    // A bare `Disallow:` means "nothing is disallowed"; anything else here would
    // hide part of the documentation from crawlers.
    for (const rule of wildcard!.rules) {
      if (rule.field === 'disallow') expect(rule.value).toBe('');
    }
  });

  it('points at the sitemap with a full, absolute https URL', () => {
    // RFC 9309 section 2.2.2 requires the value be a URL, not a path: crawlers
    // fetch it directly rather than resolving it against the host.
    expect(sitemaps.length).toBeGreaterThan(0);
    for (const url of sitemaps) {
      expect(() => new URL(url)).not.toThrow();
      expect(new URL(url).protocol).toBe('https:');
      expect(url).toMatch(/\.xml$/);
    }
  });

  it('keeps the machine-readable endpoints crawlable for every group', () => {
    for (const group of groups) {
      const allowed = group.rules
        .filter((rule) => rule.field === 'allow')
        .map((rule) => rule.value);
      expect(allowed, `group ${group.agents.join(', ')} does not allow /`).toContain('/');
    }
  });
});
