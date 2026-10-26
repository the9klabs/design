import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import I9kAskAi from '../src/components/I9kAskAi.vue';
import I9kFooter from '../src/components/I9kFooter.vue';
import { askAiUrl } from '../src/utils/askAi';

const prompt = 'What is 9k School (https://9k.school)? Q&A, please.';

describe('askAiUrl', () => {
  it('opens each assistant with the whole prompt encoded', () => {
    const q = encodeURIComponent(prompt);
    expect(askAiUrl('chatgpt', prompt)).toBe(`https://chatgpt.com/?q=${q}`);
    expect(askAiUrl('perplexity', prompt)).toBe(`https://www.perplexity.ai/search?q=${q}`);
    expect(askAiUrl('claude', prompt)).toBe(`https://claude.ai/new?q=${q}`);
  });

  it('keeps Arabic text intact through the round trip', () => {
    const arabic = 'إيه هي 9k School؟';
    const url = new URL(askAiUrl('claude', arabic));
    expect(url.searchParams.get('q')).toBe(arabic);
  });
});

describe('I9kAskAi', () => {
  it('links every assistant in order, in a new tab without a referrer', () => {
    const wrapper = mount(I9kAskAi, { props: { prompt } });
    const links = wrapper.findAll('a');
    expect(links.map((link) => link.text())).toEqual(['ChatGPT', 'Perplexity', 'Claude']);
    for (const link of links) {
      expect(link.attributes('target')).toBe('_blank');
      expect(link.attributes('rel')).toBe('noopener noreferrer');
    }
    expect(links[2].attributes('href')).toBe(askAiUrl('claude', prompt));
  });

  it('renders the heading at the level asked for, and none without one', () => {
    expect(mount(I9kAskAi, { props: { prompt } }).find('h2').exists()).toBe(false);
    const wrapper = mount(I9kAskAi, {
      props: { prompt, heading: 'Ask AI about 9k School', headingTag: 'h3' },
    });
    expect(wrapper.find('h3').text()).toBe('Ask AI about 9k School');
  });

  it('shows only the assistants passed and reports which one was pressed', async () => {
    const wrapper = mount(I9kAskAi, { props: { prompt, providers: ['claude'] } });
    expect(wrapper.findAll('a')).toHaveLength(1);
    await wrapper.find('a').trigger('click');
    expect(wrapper.emitted('click')?.[0]?.[0]).toBe('claude');
  });

  it('centres itself only when asked', () => {
    expect(mount(I9kAskAi, { props: { prompt } }).classes()).not.toContain('i9k-ask-ai--center');
    expect(mount(I9kAskAi, { props: { prompt, align: 'center' } }).classes()).toContain(
      'i9k-ask-ai--center',
    );
  });

  it('keeps the logos out of the accessible name', () => {
    const wrapper = mount(I9kAskAi, { props: { prompt } });
    expect(wrapper.find('svg').attributes('aria-hidden')).toBe('true');
  });
});

describe('I9kFooter extra slot', () => {
  it('renders the extra row in both layouts', () => {
    const slots = { extra: '<p class="ask">Ask</p>' };
    const structured = mount(I9kFooter, {
      props: { columns: [{ id: 'a', title: 'A', links: [] }] },
      slots,
    });
    expect(structured.find('.i9k-footer__extra .ask').exists()).toBe(true);
    expect(mount(I9kFooter, { slots }).find('.ask').exists()).toBe(true);
  });
});
