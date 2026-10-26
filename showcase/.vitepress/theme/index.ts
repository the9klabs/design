import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';

import '../../../src/styles/font-faces.css';
import '../../../src/styles/index.css';
import './style.css';

import DocsColorTokens from './components/DocsColorTokens.vue';
import DocsComponentGrid from './components/DocsComponentGrid.vue';
import DocsDemo from './components/DocsDemo.vue';
import DocsPageActions from './components/DocsPageActions.vue';
import DocsRules from './components/DocsRules.vue';
import DocsLayout from './DocsLayout.vue';

export default {
  extends: DefaultTheme,
  Layout: DocsLayout,
  enhanceApp({ app }) {
    // Pages place these by name, so they are registered globally.
    app.component('DocsColorTokens', DocsColorTokens);
    app.component('DocsComponentGrid', DocsComponentGrid);
    app.component('DocsDemo', DocsDemo);
    app.component('DocsPageActions', DocsPageActions);
    app.component('DocsRules', DocsRules);
  },
} satisfies Theme;
