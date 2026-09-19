import { renderToString } from '@vue/server-renderer';
import { mount } from '@vue/test-utils';
import { createSSRApp, defineComponent, h, ref } from 'vue';
import { afterEach, describe, expect, it } from 'vitest';

import I9kSection from '../src/components/I9kSection.vue';

const mounted: { unmount: () => void }[] = [];

afterEach(() => {
  while (mounted.length) mounted.pop()!.unmount();
  document.body.innerHTML = '';
});

// Attached to the document so `isVisible()` sees the `hidden` attribute through
// computed styles as well as through the attribute itself.
function mountSection(
  props: Record<string, unknown> = {},
  slots: Record<string, () => unknown> = {},
) {
  const wrapper = mount(I9kSection, {
    props: { title: 'Team', ...props },
    slots: { default: () => 'Body', ...slots },
    attachTo: document.body,
  });
  mounted.push(wrapper);
  return wrapper;
}

describe('I9kSection', () => {
  it('is a section named by its heading, with its body always shown when not collapsible', () => {
    const wrapper = mountSection();
    const section = wrapper.get('section');
    const heading = wrapper.get('h2');

    expect(heading.text()).toBe('Team');
    expect(section.attributes('aria-labelledby')).toBe(heading.attributes('id'));
    expect(wrapper.find('button').exists()).toBe(false);
    expect(wrapper.find('[data-i9k-section-toggle]').exists()).toBe(false);
    expect(wrapper.get('[data-i9k-section-body]').isVisible()).toBe(true);
    expect(wrapper.get('[data-i9k-section-body]').text()).toBe('Body');
  });

  it('renders the requested heading level', () => {
    expect(mountSection({ level: 3 }).get('h3').text()).toBe('Team');
    expect(mountSection({ level: 4 }).get('h4').text()).toBe('Team');
  });

  it('derives its heading and body ids from a given id', () => {
    const wrapper = mountSection({ id: 'team', open: true });

    expect(wrapper.get('section').attributes('id')).toBe('team');
    expect(wrapper.get('section').attributes('aria-labelledby')).toBe('team-heading');
    expect(wrapper.get('#team-heading').text()).toBe('Team');
    expect(wrapper.get('[data-i9k-section-toggle]').attributes('aria-controls')).toBe('team-body');
    expect(wrapper.get('#team-body').text()).toBe('Body');
  });

  it('generates its ids when the given id is empty', () => {
    const wrapper = mountSection({ id: '', open: true });
    const section = wrapper.get('section');
    const labelledBy = section.attributes('aria-labelledby');

    expect(section.attributes('id')).toBeUndefined();
    expect(labelledBy).not.toBe('-heading');
    expect(wrapper.get(`[id="${labelledBy}"]`).text()).toBe('Team');
    expect(wrapper.get('[data-i9k-section-toggle]').attributes('aria-controls')).not.toBe('-body');
  });

  it('generates distinct, wired ids for sibling sections when no id is given', () => {
    // useId() is unique within one app, so the siblings share a host.
    const host = mount(
      defineComponent({
        components: { I9kSection },
        template: `<div>
          <I9kSection :open="true" title="Team">Team body</I9kSection>
          <I9kSection :open="true" title="Projects">Project body</I9kSection>
        </div>`,
      }),
      { attachTo: document.body },
    );
    mounted.push(host);
    const sections = host.findAll('section');
    const labels = sections.map((section) => section.attributes('aria-labelledby'));

    expect(sections.map((section) => section.attributes('id'))).toEqual([undefined, undefined]);
    expect(new Set(labels).size).toBe(2);
    expect(labels.map((label) => host.get(`[id="${label}"]`).text())).toEqual(['Team', 'Projects']);
    const controls = host
      .findAll('[data-i9k-section-toggle]')
      .map((toggle) => host.get(`[id="${toggle.attributes('aria-controls')}"]`).text());
    expect(controls).toEqual(['Team body', 'Project body']);
  });

  it('puts a disclosure button inside the heading when open is bound', () => {
    const wrapper = mountSection({ id: 'team', open: false });
    const toggle = wrapper.get('h2 > button');

    expect(toggle.attributes('type')).toBe('button');
    expect(toggle.attributes('data-i9k-section-toggle')).toBeDefined();
    expect(toggle.text()).toBe('Team');
    expect(toggle.get('svg').attributes('aria-hidden')).toBe('true');
    expect(toggle.attributes('aria-expanded')).toBe('false');
  });

  it('leaves a controlled section closed until the parent opens it', async () => {
    const wrapper = mountSection({ id: 'team', open: false });
    const toggle = wrapper.get('[data-i9k-section-toggle]');

    expect(wrapper.get('#team-body').isVisible()).toBe(false);
    await toggle.trigger('click');
    expect(wrapper.emitted('update:open')).toEqual([[true]]);
    expect(toggle.attributes('aria-expanded')).toBe('false');
    expect(wrapper.get('#team-body').isVisible()).toBe(false);

    await wrapper.setProps({ open: true });
    expect(toggle.attributes('aria-expanded')).toBe('true');
    expect(wrapper.get('#team-body').isVisible()).toBe(true);

    await toggle.trigger('click');
    expect(wrapper.emitted('update:open')).toEqual([[true], [false]]);
  });

  it('follows v-model:open in both directions', async () => {
    const open = ref(false);
    const host = mount(
      defineComponent({
        components: { I9kSection },
        setup: () => ({ open }),
        template: `<div>
          <button type="button" data-expand-all @click="open = true">Expand all</button>
          <I9kSection v-model:open="open" title="Team">Body</I9kSection>
        </div>`,
      }),
      { attachTo: document.body },
    );
    mounted.push(host);
    const toggle = () => host.get('[data-i9k-section-toggle]');
    const body = () => host.get('[data-i9k-section-body]');

    await toggle().trigger('click');
    expect(open.value).toBe(true);
    expect(toggle().attributes('aria-expanded')).toBe('true');
    expect(body().isVisible()).toBe(true);

    await toggle().trigger('click');
    expect(open.value).toBe(false);
    expect(body().isVisible()).toBe(false);

    await host.get('[data-expand-all]').trigger('click');
    expect(toggle().attributes('aria-expanded')).toBe('true');
    expect(body().isVisible()).toBe(true);
  });

  it('manages its own state when collapsible without a bound open', async () => {
    const wrapper = mountSection({ collapsible: true });
    const toggle = wrapper.get('[data-i9k-section-toggle]');
    const body = wrapper.get('[data-i9k-section-body]');

    expect(toggle.attributes('aria-expanded')).toBe('true');
    expect(body.isVisible()).toBe(true);

    await toggle.trigger('click');
    expect(toggle.attributes('aria-expanded')).toBe('false');
    expect(body.isVisible()).toBe(false);

    await toggle.trigger('click');
    expect(toggle.attributes('aria-expanded')).toBe('true');
    expect(wrapper.emitted('update:open')).toEqual([[false], [true]]);
  });

  it('keeps its last controlled state when a collapsible section stops being controlled', async () => {
    const wrapper = mountSection({ collapsible: true, open: false });
    const toggle = wrapper.get('[data-i9k-section-toggle]');
    const body = wrapper.get('[data-i9k-section-body]');

    await wrapper.setProps({ open: undefined });
    expect(toggle.attributes('aria-expanded')).toBe('false');
    expect(body.isVisible()).toBe(false);

    await toggle.trigger('click');
    expect(toggle.attributes('aria-expanded')).toBe('true');
    expect(body.isVisible()).toBe(true);
  });

  it('starts an uncontrolled section closed when defaultOpen is false', () => {
    const wrapper = mountSection({ collapsible: true, defaultOpen: false });
    expect(wrapper.get('[data-i9k-section-toggle]').attributes('aria-expanded')).toBe('false');
    expect(wrapper.get('[data-i9k-section-body]').isVisible()).toBe(false);
  });

  it('ignores defaultOpen when it is not collapsible', () => {
    const wrapper = mountSection({ defaultOpen: false });
    expect(wrapper.get('[data-i9k-section-body]').isVisible()).toBe(true);
  });

  it('keeps actions and toolbar in the header, outside the button and the body', async () => {
    const wrapper = mountSection(
      { open: false },
      {
        actions: () => h('button', { type: 'button', 'data-action': 'add' }, 'Invite member'),
        toolbar: () => h('button', { type: 'button', 'data-action': 'filter' }, 'Hide archived'),
      },
    );
    const add = wrapper.get('[data-action="add"]');
    const filter = wrapper.get('[data-action="filter"]');

    expect(wrapper.find('[data-i9k-section-toggle] [data-action]').exists()).toBe(false);
    expect(wrapper.find('h2 [data-action]').exists()).toBe(false);
    expect(wrapper.find('[data-i9k-section-body] [data-action]').exists()).toBe(false);
    // Reachable while the section is closed, since they sit outside its body.
    expect(add.isVisible()).toBe(true);
    expect(filter.isVisible()).toBe(true);

    // The disclosure button comes first in the tab order, then the actions.
    const buttons: Element[] = wrapper.findAll('button').map((button) => button.element);
    expect(buttons[0]).toBe(wrapper.get('[data-i9k-section-toggle]').element);
    expect(buttons.indexOf(add.element)).toBeLessThan(buttons.indexOf(filter.element));

    await add.trigger('click');
    expect(wrapper.emitted('update:open')).toBeUndefined();
  });

  // The admin pages render the default section, so the new surface options must
  // not add anything to its root.
  it('renders no surface modifiers by default', () => {
    expect(mountSection().get('section').classes()).toEqual(['i9k-section']);
  });

  it.each([
    [{ variant: 'primary' }, ['i9k-section', 'i9k-section--primary']],
    [{ fullWidth: true }, ['i9k-section', 'i9k-section--full-width']],
    [
      { variant: 'primary', fullWidth: true },
      ['i9k-section', 'i9k-section--primary', 'i9k-section--full-width'],
    ],
  ])('marks the root for %o', (props, classes) => {
    const section = mountSection(props).get('section');

    expect(section.classes()).toEqual(classes);
    expect(section.attributes('variant')).toBeUndefined();
    expect(section.attributes('fullwidth')).toBeUndefined();
  });

  it('server-renders a full-width primary band without an inline style', async () => {
    const html = await renderToString(
      createSSRApp({
        components: { I9kSection },
        template: '<I9kSection variant="primary" full-width title="Join">Body</I9kSection>',
      }),
    );

    expect(html).toContain('class="i9k-section i9k-section--primary i9k-section--full-width"');
    expect(html).not.toContain('style=');
  });

  it('server-renders a closed body with the hidden attribute and no inline style', async () => {
    const html = await renderToString(
      createSSRApp({
        components: { I9kSection },
        template: '<I9kSection id="details" :open="false" title="Details">Body</I9kSection>',
      }),
    );

    expect(html).toMatch(/<div[^>]*id="details-body"[^>]*hidden/);
    expect(html).not.toContain('style=');
    expect(html).toContain('aria-expanded="false"');
  });
});
