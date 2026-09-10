<script setup lang="ts">
const props = withDefaults(defineProps<{ defaultOpen?: boolean }>(), {
  defaultOpen: false,
});

const emit = defineEmits<{ toggle: [open: boolean] }>();
const initialOpen = props.defaultOpen;

function onToggle(event: Event) {
  const details = event.currentTarget;
  if (!(details instanceof HTMLDetailsElement)) return;
  emit('toggle', details.open);
}
</script>

<template>
  <details class="i9k-collapsible" :open="initialOpen" @toggle="onToggle">
    <summary class="i9k-collapsible__summary">
      <span class="i9k-collapsible__summary-content"><slot name="summary" /></span>
      <span class="i9k-collapsible__indicator" aria-hidden="true" />
    </summary>
    <div class="i9k-collapsible__body"><slot /></div>
  </details>
</template>

<style scoped>
.i9k-collapsible {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--surface-color);
  transition: var(--transition);
}

.i9k-collapsible:hover,
.i9k-collapsible[open] {
  border-color: color-mix(in srgb, var(--primary-color) 34%, var(--border-color));
}

.i9k-collapsible__summary {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--spacing-8);
  align-items: center;
  padding: var(--spacing-8) var(--spacing-10);
  border-radius: inherit;
  cursor: pointer;
  font-weight: 600;
  list-style: none;
  transition: var(--transition);
}

.i9k-collapsible__summary::-webkit-details-marker {
  display: none;
}

.i9k-collapsible__summary:hover {
  background: var(--primary-color-alpha-12);
}

.i9k-collapsible__summary:focus-visible {
  outline: 3px solid var(--focus-color);
  outline-offset: 3px;
}

.i9k-collapsible__summary-content {
  min-width: 0;
}

.i9k-collapsible__indicator {
  position: relative;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: var(--radius-circle);
  background: var(--primary-color-alpha-12);
}

.i9k-collapsible__indicator::before,
.i9k-collapsible__indicator::after {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  width: 0.75rem;
  height: 2px;
  background: var(--primary-text-color);
  content: '';
  transform: translate(-50%, -50%);
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

[dir='rtl'] .i9k-collapsible__indicator::before,
[dir='rtl'] .i9k-collapsible__indicator::after {
  inset-inline-start: auto;
  inset-inline-end: 50%;
}

.i9k-collapsible__indicator::after {
  transform: translate(-50%, -50%) rotate(90deg);
}

.i9k-collapsible[open] .i9k-collapsible__indicator::after {
  transform: translate(-50%, -50%) rotate(0deg);
}

.i9k-collapsible__body {
  padding: 0 var(--spacing-10) var(--spacing-10);
  color: var(--text-color-light);
  line-height: 1.6;
}

@media (prefers-reduced-motion: reduce) {
  .i9k-collapsible,
  .i9k-collapsible__summary,
  .i9k-collapsible__indicator::before,
  .i9k-collapsible__indicator::after {
    transition: none;
  }
}
</style>
