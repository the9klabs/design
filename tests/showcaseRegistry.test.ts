import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { extractComponent } from '../showcase/extract/props';
import { entries } from '../showcase/registry';
import { mergeRegistry } from '../showcase/registry/merge';
import { SECTIONS } from '../showcase/registry/sections';

const exportedNames = [
  ...readFileSync(resolve('src/index.ts'), 'utf8').matchAll(/export \{ default as (I9k\w+) \}/g),
].map((match) => match[1]);

const sectionIds = new Set(SECTIONS.map((section) => section.id));

// --- Step 3B: fabricated-API guard support --------------------------------
//
// Registry entries are hand-written prose plus copy-pasteable demo code, so
// unlike the props table (which is extracted from source) they can name a
// component or an enum value that does not actually exist. This section
// scans every `<I9kFoo attr="value">` usage in each registry file — prompt
// text and demo code alike — and checks it against the real component.

/** Attribute names treated as enum-ish: their values are checked against real literals. */
const ENUM_ATTRS = new Set(['variant', 'size', 'tone', 'ui-size', 'columns', 'type', 'as']);

/** Template attribute name -> the prop name it binds to, where they differ. */
const ATTR_TO_PROP: Record<string, string> = { 'ui-size': 'uiSize' };

const componentsTsText = readFileSync(resolve('src/types/components.ts'), 'utf8');
const iconNames = new Set(
  Object.keys(JSON.parse(readFileSync(resolve('src/icons/paths.json'), 'utf8'))),
);

const scriptSetupCache = new Map<string, string | null>();

/** Returns the raw `<script setup>` text of a component, or null if the file doesn't exist. */
function scriptSetupFor(componentName: string): string | null {
  if (scriptSetupCache.has(componentName)) return scriptSetupCache.get(componentName)!;
  const path = resolve(`src/components/${componentName}.vue`);
  if (!existsSync(path)) {
    scriptSetupCache.set(componentName, null);
    return null;
  }
  const source = readFileSync(path, 'utf8');
  const match = source.match(/<script setup[^>]*>([\s\S]*?)<\/script>/);
  const script = match ? match[1] : '';
  scriptSetupCache.set(componentName, script);
  return script;
}

/** Pulls every quoted string literal and bare numeric literal out of a type-union text. */
function literalsIn(text: string): Set<string> {
  const literals = new Set<string>();
  for (const m of text.matchAll(/'([^']*)'/g)) literals.add(m[1]);
  for (const m of text.matchAll(/"([^"]*)"/g)) literals.add(m[1]);
  for (const m of text.matchAll(/(?<![\w.])-?\d+(?:\.\d+)?(?![\w])/g)) literals.add(m[0]);
  return literals;
}

/**
 * Resolves the set of legal values for `propName` on a component, given its own
 * `<script setup>` text. Returns null when the prop isn't actually a literal
 * union (e.g. `string | number`) — nothing to validate against, so callers must
 * skip the check rather than treat null as a violation.
 */
function resolveAllowedValues(propName: string, scriptText: string): Set<string> | null {
  const declMatch = scriptText.match(new RegExp(`\\b${propName}\\??\\s*:\\s*([^;}]+)`));
  if (!declMatch) return null;

  const typeText = declMatch[1].trim();
  if (typeText.includes("'") || typeText.includes('"')) return literalsIn(typeText);

  const idMatch = typeText.match(/^[A-Za-z_$][\w]*$/);
  if (!idMatch) return null;
  const id = idMatch[0];

  const localAlias = scriptText.match(new RegExp(`\\btype\\s+${id}\\s*=\\s*([^;]+);`));
  if (localAlias) return literalsIn(localAlias[1]);

  const sharedAlias = componentsTsText.match(new RegExp(`export type ${id}\\s*=\\s*([^;]+);`));
  if (sharedAlias) return literalsIn(sharedAlias[1]);

  return null;
}

/** Every `<I9kFoo ...>` usage — with component name, full tag text, and attrs. */
function tagsIn(fileText: string): { component: string; tagText: string }[] {
  return [...fileText.matchAll(/<I9k[A-Za-z0-9]+(?:\s[^<>]*)?>/g)].map((tagMatch) => {
    const tagText = tagMatch[0];
    const component = tagText.match(/^<(I9k[A-Za-z0-9]+)/)![1];
    return { component, tagText };
  });
}

describe('showcase registry', () => {
  it('finds the exported component names it is measured against', () => {
    expect(exportedNames.length).toBe(37);
  });

  it('names only real exports', () => {
    const unknown = entries.filter((entry) => !exportedNames.includes(entry.name));
    expect(unknown.map((entry) => entry.name)).toEqual([]);
  });

  it('has no duplicate entries', () => {
    const names = entries.map((entry) => entry.name);
    expect(names).toEqual([...new Set(names)]);
  });

  it('documents every component exported from src/index.ts', () => {
    const documented = new Set(entries.map((entry) => entry.name));
    const missing = exportedNames.filter((name) => !documented.has(name));
    expect(missing).toEqual([]);
  });

  it.each(entries.map((entry) => [entry.name, entry] as const))(
    '%s carries a summary, a prompt, a demo, and a known section',
    (_name, entry) => {
      expect(entry.summary.length).toBeGreaterThan(20);
      expect(entry.agentPrompt.length).toBeGreaterThan(80);
      expect(entry.agentPrompt).toContain('@9klabs/design');
      expect(entry.demos.length).toBeGreaterThan(0);
      expect(sectionIds.has(entry.section)).toBe(true);
    },
  );

  it('merges extracted props onto the entry', () => {
    const extracted = entries.map((entry) =>
      extractComponent(resolve(`src/components/${entry.name}.vue`)),
    );
    const merged = mergeRegistry(entries, extracted);
    const input = merged.find((component) => component.name === 'I9kInput');
    expect(input?.props.map((prop) => prop.name)).toContain('uiSize');
    expect(input?.emits).toEqual([{ name: 'update:modelValue', payload: '[value: string]' }]);
  });
});

describe('showcase registry entries name only real components and known values', () => {
  it.each(entries.map((entry) => [entry.name, entry] as const))(
    '%s only references real I9k components, known enum values, and known icon names',
    (_name, entry) => {
      const filePath = resolve(`showcase/registry/${entry.name}.ts`);
      const fileText = readFileSync(filePath, 'utf8');
      const problems: string[] = [];

      for (const { component, tagText } of tagsIn(fileText)) {
        const componentPath = resolve(`src/components/${component}.vue`);
        if (!existsSync(componentPath)) {
          problems.push(
            `<${component}> is not a real component (no src/components/${component}.vue)`,
          );
          continue;
        }

        const scriptText = scriptSetupFor(component)!;

        for (const attrMatch of tagText.matchAll(/([:@]?[\w-]+)\s*=\s*"([^"]*)"/g)) {
          const attrName = attrMatch[1];
          const value = attrMatch[2];
          if (attrName.startsWith(':') || attrName.startsWith('@')) continue;
          if (!ENUM_ATTRS.has(attrName)) continue;

          const propName = ATTR_TO_PROP[attrName] ?? attrName;
          const allowed = resolveAllowedValues(propName, scriptText);
          if (allowed && !allowed.has(value)) {
            problems.push(
              `<${component} ${attrName}="${value}"> — "${value}" is not a known value ` +
                `for ${component}'s "${propName}" prop (expected one of: ${[...allowed].join(', ')})`,
            );
          }
        }

        if (component === 'I9kIcon') {
          for (const nameMatch of tagText.matchAll(/(?:^|\s)name\s*=\s*"([^"]*)"/g)) {
            const value = nameMatch[1];
            if (!iconNames.has(value)) {
              problems.push(
                `<I9kIcon name="${value}"> — "${value}" is not a key in src/icons/paths.json`,
              );
            }
          }
        }
      }

      expect(problems).toEqual([]);
    },
  );
});
