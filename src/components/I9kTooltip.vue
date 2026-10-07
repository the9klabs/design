<script setup lang="ts">
import { onBeforeUnmount, ref, useId, watch } from 'vue';

defineProps<{
  /** The tooltip's words. They also describe the trigger to assistive technology. */
  text: string;
}>();

defineSlots<{
  /**
   * The trigger. Bind `describedBy` to its `aria-describedby`, and make it
   * focusable (a button, a link, or `tabindex="0"`) so a keyboard can open it.
   */
  default(props: { describedBy: string }): unknown;
}>();

const id = useId();
const root = ref<HTMLElement | null>(null);
const open = ref(false);

// Hover answers a mouse or a pen; a finger has no hover, so a tap toggles
// instead. A touch pointer enters on press and leaves on lift, so both are
// ignored for touch. The press records the state a tap toggles from, because
// the same tap also focuses the trigger, which opens it before the click.
let pressPointer = '';
let openAtPress = false;

function onPointerEnter(event: PointerEvent) {
  if (event.pointerType !== 'touch') open.value = true;
}

function onPointerLeave(event: PointerEvent) {
  if (event.pointerType !== 'touch') open.value = false;
}

function onPointerDown(event: PointerEvent) {
  pressPointer = event.pointerType;
  openAtPress = open.value;
}

function onClick() {
  if (pressPointer === 'touch') open.value = !openAtPress;
  pressPointer = '';
}

function onFocusIn() {
  open.value = true;
}

function onFocusOut(event: FocusEvent) {
  const next = event.relatedTarget;
  if (!(next instanceof Node && root.value?.contains(next))) open.value = false;
}

// WCAG 1.4.13: an open tooltip is dismissed by Escape without moving the
// pointer or the focus, and by a press anywhere else.
function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = false;
}

function onDocumentPointerDown(event: PointerEvent) {
  const target = event.target;
  if (!(target instanceof Node && root.value?.contains(target))) open.value = false;
}

function listenWhileOpen(listen: boolean) {
  if (typeof document === 'undefined') return;
  if (listen) {
    document.addEventListener('keydown', onDocumentKeydown);
    document.addEventListener('pointerdown', onDocumentPointerDown);
  } else {
    document.removeEventListener('keydown', onDocumentKeydown);
    document.removeEventListener('pointerdown', onDocumentPointerDown);
  }
}

watch(open, listenWhileOpen);
onBeforeUnmount(() => listenWhileOpen(false));
</script>

<template>
  <span
    ref="root"
    class="i9k-tooltip"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
    @pointerdown="onPointerDown"
    @click="onClick"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
  >
    <slot v-bind="{ describedBy: id }" />
    <span :id="id" class="i9k-tooltip__bubble" role="tooltip" :hidden="!open">{{ text }}</span>
  </span>
</template>

<style scoped>
.i9k-tooltip {
  --i9k-tooltip-gap: var(--spacing-3);
  --i9k-tooltip-width: 18rem;

  position: relative;
  display: inline-flex;
  max-width: 100%;
  vertical-align: middle;
}

/* Above the trigger and aligned to its start edge in either reading
   direction, so a trigger at the start of a line never pushes the bubble off
   a phone screen. */
.i9k-tooltip__bubble {
  position: absolute;
  z-index: 150;
  inset-block-end: calc(100% + var(--i9k-tooltip-gap));
  inset-inline-start: 0;
  display: block;
  width: max-content;
  max-width: min(var(--i9k-tooltip-width), calc(100vw - 2 * var(--spacing-8)));
  padding: var(--spacing-3) var(--spacing-4);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--theme-bg-color);
  box-shadow: var(--shadow-md);
  color: var(--text-color);
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.5;
  text-align: start;
  white-space: normal;
}

/* Bridges the gap to the trigger, so the pointer can move onto the bubble
   without leaving the tooltip (WCAG 1.4.13, hoverable). */
.i9k-tooltip__bubble::after {
  position: absolute;
  inset-block-start: 100%;
  inset-inline: 0;
  height: var(--i9k-tooltip-gap);
  content: '';
}

/* Hidden by attribute rather than v-show, so a server render carries no
   inline style and a strict style-src CSP cannot show it open before
   hydration. The bubble's own display: block would otherwise beat the UA
   [hidden] rule. */
.i9k-tooltip__bubble[hidden] {
  display: none;
}
</style>
