import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { extractComponent } from '../showcase/extract/props';

const component = (name: string) => extractComponent(resolve(`src/components/${name}.vue`));

describe('showcase prop extraction', () => {
  it('reads every prop I9kButton declares, in source order', () => {
    expect(component('I9kButton').props.map((prop) => prop.name)).toEqual([
      'to',
      'href',
      'variant',
      'size',
      'active',
      'type',
      'linkComponent',
    ]);
  });

  it('reads the value withDefaults supplies', () => {
    const size = component('I9kButton').props.find((prop) => prop.name === 'size');
    expect(size?.default).toBe("'md'");
  });

  it('marks an optional prop as not required', () => {
    const size = component('I9kButton').props.find((prop) => prop.name === 'size');
    expect(size?.required).toBe(false);
  });

  it('marks a prop with no question token as required and defaultless', () => {
    const modelValue = component('I9kInput').props.find((prop) => prop.name === 'modelValue');
    expect(modelValue).toMatchObject({ required: true, default: null, type: 'string' });
  });

  it('resolves an alias imported from src/types to its literal union', () => {
    const size = component('I9kBadge').props.find((prop) => prop.name === 'size');
    expect(size?.type).toBe("'sm' | 'md' | 'lg'");
  });

  it('resolves an alias declared inside the component', () => {
    const variant = component('I9kButton').props.find((prop) => prop.name === 'variant');
    expect(variant?.type).toBe("'default' | 'primary' | 'link' | 'filter' | 'pagination' | 'page'");
  });

  it('resolves a union mixing numeric and string literals', () => {
    const columns = component('I9kGrid').props.find((prop) => prop.name === 'columns');
    expect(columns?.type).toBe("1 | 2 | 3 | 'auto'");
  });

  it('leaves an inline union untouched', () => {
    const to = component('I9kButton').props.find((prop) => prop.name === 'to');
    expect(to?.type).toBe('string | Record<string, unknown> | null');
  });

  it('keeps an interface alias by name and records its declaration', () => {
    const extracted = component('I9kNavigation');
    const links = extracted.props.find((prop) => prop.name === 'links');
    expect(links?.type).toBe('I9kNavigationLink[]');
    expect(extracted.referencedTypes.I9kNavigationLink).toContain('label: string');
  });

  it('reads props declared with the runtime defineProps form', () => {
    expect(component('I9kBrandWordmark').props).toEqual([
      { name: 'compact', type: 'boolean', required: false, default: 'false' },
      { name: 'full', type: 'string', required: false, default: "'Ismail9k'" },
      { name: 'short', type: 'string', required: false, default: "'9k'" },
    ]);
  });

  it('reports no props for a component that declares none', () => {
    expect(component('I9kBlurredCircles').props).toEqual([]);
  });

  it('never returns an empty prop list for a component that calls defineProps', () => {
    const dir = resolve('src/components');
    const silent = readdirSync(dir)
      .filter((file) => file.endsWith('.vue'))
      .filter((file) => readFileSync(join(dir, file), 'utf8').includes('defineProps'))
      .filter((file) => extractComponent(join(dir, file)).props.length === 0);
    expect(silent).toEqual([]);
  });
});

describe('showcase emit and slot extraction', () => {
  it('reads a model emit with its payload tuple', () => {
    expect(component('I9kInput').emits).toEqual([
      { name: 'update:modelValue', payload: '[value: string]' },
    ]);
  });

  it('reads an emit whose payload references a component-local interface', () => {
    expect(component('I9kNavigation').emits).toEqual([
      { name: 'navigate', payload: '[link: I9kNavigationLink, event: MouseEvent]' },
    ]);
  });

  it('reads named slots in template order', () => {
    expect(component('I9kNavigation').slots).toEqual(['brand', 'actions']);
  });

  it('lists a slot rendered in both branches of a v-if once', () => {
    expect(component('I9kFooter').slots).toEqual(['brand', 'default', 'social-icon', 'utilities']);
  });

  it('reports an unnamed slot as default', () => {
    expect(component('I9kGrid').slots).toEqual(['default']);
  });

  it('reports no slots for a component that renders none', () => {
    expect(component('I9kInput').slots).toEqual([]);
  });

  it('never returns an empty emits list for a component that calls defineEmits', () => {
    const dir = resolve('src/components');
    const silent = readdirSync(dir)
      .filter((file) => file.endsWith('.vue'))
      .filter((file) => readFileSync(join(dir, file), 'utf8').includes('defineEmits'))
      .filter((file) => extractComponent(join(dir, file)).emits.length === 0);
    expect(silent).toEqual([]);
  });
});
