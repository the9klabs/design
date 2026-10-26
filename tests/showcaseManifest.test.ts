import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { extractComponent } from '../showcase/extract/props';
import { buildManifest } from '../showcase/manifest';
import { entries } from '../showcase/registry';
import { mergeRegistry } from '../showcase/registry/merge';
import { RULES } from '../showcase/registry/rules';

const components = mergeRegistry(
  entries,
  entries.map((entry) => extractComponent(resolve(`src/components/${entry.name}.vue`))),
);
const manifest = buildManifest(components, '1.2.3');

describe('showcase manifest', () => {
  it('names the package and its stylesheet entry point', () => {
    expect(manifest.package).toBe('@9klabs/design');
    expect(manifest.styleImport).toBe('@9klabs/design/style.css');
    expect(manifest.version).toBe('1.2.3');
  });

  it('carries the shared rules list verbatim', () => {
    expect(manifest.rules).toEqual(RULES);
  });

  it('gives every component a prompt, a summary, and a section', () => {
    for (const component of manifest.components) {
      expect(component.prompt.length).toBeGreaterThan(80);
      expect(component.summary.length).toBeGreaterThan(20);
      expect(component.section).toBeTruthy();
    }
  });

  it('carries resolved prop types rather than alias names', () => {
    const grid = manifest.components.find((component) => component.name === 'I9kGrid');
    const columns = grid?.props.find((prop) => prop.name === 'columns');
    expect(columns?.type).toBe("1 | 2 | 3 | 'auto'");
  });

  it('serialises to JSON without loss', () => {
    expect(() => JSON.parse(JSON.stringify(manifest))).not.toThrow();
  });

  it('reports a version that matches package.json when built from it', () => {
    const version = JSON.parse(readFileSync(resolve('package.json'), 'utf8')).version;
    expect(buildManifest(components, version).version).toBe(version);
  });
});
