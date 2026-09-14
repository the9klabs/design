import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { describe, expect, it } from 'vitest';

import I9kCollapsible from '../src/components/I9kCollapsible.vue';

describe('I9kCollapsible', () => {
  it('renders native disclosure markup and both slots', () => {
    const wrapper = mount(I9kCollapsible, {
      slots: {
        summary: '<strong>Module one</strong>',
        default: '<ol><li>First lesson</li></ol>',
      },
    });

    expect(wrapper.element.tagName).toBe('DETAILS');
    expect(wrapper.get('summary strong').text()).toBe('Module one');
    expect(wrapper.get('.i9k-collapsible__body li').text()).toBe('First lesson');
    expect(wrapper.get('.i9k-collapsible__indicator').attributes('aria-hidden')).toBe('true');
  });

  it('is closed by default and supports an initially open state', () => {
    expect(mount(I9kCollapsible).get('details').element.open).toBe(false);
    expect(
      mount(I9kCollapsible, { props: { defaultOpen: true } }).get('details').element.open,
    ).toBe(true);
  });

  it('emits the current native open state after each toggle', async () => {
    const wrapper = mount(I9kCollapsible);
    const details = wrapper.get('details');

    details.element.open = true;
    await details.trigger('toggle');
    details.element.open = false;
    await details.trigger('toggle');

    expect(wrapper.emitted('toggle')).toEqual([[true], [false]]);
  });

  it('does not coordinate the state of sibling instances', async () => {
    const host = mount(
      defineComponent({
        components: { I9kCollapsible },
        template: `
          <div>
            <I9kCollapsible><template #summary>One</template>First</I9kCollapsible>
            <I9kCollapsible><template #summary>Two</template>Second</I9kCollapsible>
          </div>
        `,
      }),
    );
    const details = host.findAll('details');

    details[0].element.open = true;
    await details[0].trigger('toggle');
    details[1].element.open = true;
    await details[1].trigger('toggle');

    expect(details.map((item) => item.element.open)).toEqual([true, true]);
  });

  it('follows a bound open prop', async () => {
    const wrapper = mount(I9kCollapsible, { props: { open: false } });
    const details = wrapper.get('details').element as HTMLDetailsElement;
    expect(details.open).toBe(false);
    await wrapper.setProps({ open: true });
    expect(details.open).toBe(true);
    await wrapper.setProps({ open: false });
    expect(details.open).toBe(false);
  });

  it('reports a user toggle through update:open when controlled', async () => {
    const wrapper = mount(I9kCollapsible, { props: { open: false } });
    const details = wrapper.get('details');
    details.element.open = true;
    await details.trigger('toggle');
    expect(wrapper.emitted('update:open')).toEqual([[true]]);
    expect(wrapper.emitted('toggle')).toEqual([[true]]);
  });

  it('stays uncontrolled when open is not bound', async () => {
    const wrapper = mount(I9kCollapsible, { props: { defaultOpen: true } });
    const details = wrapper.get('details');
    expect(details.element.open).toBe(true);
    details.element.open = false;
    await details.trigger('toggle');
    expect(wrapper.emitted('update:open')).toBeUndefined();
    expect(details.element.open).toBe(false);
  });
});
