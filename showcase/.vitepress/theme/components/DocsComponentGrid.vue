<script setup lang="ts">
import { withBase } from 'vitepress';

import { entries } from '../../../registry';
import { COMPONENT_SECTIONS, componentPath } from '../../../site/pages';

const groups = COMPONENT_SECTIONS.map((section) => ({
  ...section,
  components: entries.filter((entry) => entry.section === section.id),
}));
</script>

<template>
  <div class="docs-grid vp-raw">
    <section v-for="group in groups" :key="group.id" class="docs-grid__group">
      <h2 :id="group.id" class="docs-grid__title">{{ group.title }}</h2>
      <ul class="docs-grid__list">
        <li v-for="component in group.components" :key="component.name">
          <a class="docs-grid__card" :href="withBase(componentPath(component.name))">
            <span class="docs-grid__name">{{ component.name.replace(/^I9k/, '') }}</span>
            <span class="docs-grid__summary">{{ component.summary }}</span>
          </a>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.docs-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-15);
  margin-block-start: var(--spacing-13);
}

.docs-grid__title {
  margin: 0 0 var(--spacing-8);
  padding-block-start: var(--spacing-8);
  border-block-start: 1px solid var(--vp-c-divider);
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.docs-grid__list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
  gap: var(--spacing-8);
  margin: 0;
  padding: 0;
  list-style: none;
}

.docs-grid__card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  block-size: 100%;
  padding: var(--spacing-10);
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--radius-lg);
  background: var(--surface-color);
  color: inherit;
  font-weight: 400;
  text-decoration: none;
  transition: var(--transition);
}

.docs-grid__card:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(var(--lift));
  box-shadow: var(--shadow-md);
}

.docs-grid__name {
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.docs-grid__summary {
  display: -webkit-box;
  overflow: hidden;
  color: var(--vp-c-text-2);
  font-size: var(--text-size-1);
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

@media (prefers-reduced-motion: reduce) {
  .docs-grid__card:hover {
    transform: none;
  }
}
</style>
