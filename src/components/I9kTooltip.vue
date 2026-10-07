<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';

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

// Pixel values of the --spacing-3 gap and the --spacing-8 viewport margin,
// for placing the bubble from a measured rect.
const GAP = 6;
const VIEWPORT_MARGIN = 16;

const id = useId();
const root = ref<HTMLElement | null>(null);
const bubble = ref<HTMLElement | null>(null);
const open = ref(false);
// Where the browser supports popovers, the bubble opens in the top layer, so
// no ancestor's `overflow: hidden` or `transform` can clip or trap it, and it
// is placed from the trigger's rect. Decided after mount, so the server
// render and hydration are the same everywhere; without support it stays
// positioned inside the trigger.
const topLayer = ref(false);
const placement = ref<'above' | 'below'>('above');
let shown = false;

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

// A press the browser takes over, such as a scroll, never ends in a tap.
function onPointerCancel() {
  pressPointer = '';
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

// Above the trigger, from its start edge in the reading direction, clamped
// inside the viewport; below it when there is no room above. Written as
// custom properties through the CSSOM, which a strict style-src CSP allows.
function place() {
  const anchor = root.value;
  const element = bubble.value;
  if (!anchor || !element || !shown) return;
  const trigger = anchor.getBoundingClientRect();
  const size = element.getBoundingClientRect();
  const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
  const rtl = getComputedStyle(anchor).direction === 'rtl';

  const start = rtl ? trigger.right - size.width : trigger.left;
  const x = Math.max(
    VIEWPORT_MARGIN,
    Math.min(start, viewportWidth - size.width - VIEWPORT_MARGIN),
  );
  let y = trigger.top - size.height - GAP;
  placement.value = 'above';
  if (y < VIEWPORT_MARGIN) {
    y = trigger.bottom + GAP;
    placement.value = 'below';
  }

  element.style.setProperty('--i9k-tooltip-x', `${Math.round(x)}px`);
  element.style.setProperty('--i9k-tooltip-y', `${Math.round(y)}px`);
}

function show() {
  const element = bubble.value;
  if (!element || shown) return;
  element.showPopover();
  shown = true;
  place();
}

function hide() {
  const element = bubble.value;
  if (!element || !shown) return;
  element.hidePopover();
  shown = false;
}

function listenWhileOpen(listen: boolean) {
  if (typeof document === 'undefined') return;
  if (listen) {
    document.addEventListener('keydown', onDocumentKeydown);
    document.addEventListener('pointerdown', onDocumentPointerDown);
    if (topLayer.value) {
      window.addEventListener('scroll', place, { capture: true, passive: true });
      window.addEventListener('resize', place, { passive: true });
    }
  } else {
    document.removeEventListener('keydown', onDocumentKeydown);
    document.removeEventListener('pointerdown', onDocumentPointerDown);
    window.removeEventListener('scroll', place, { capture: true });
    window.removeEventListener('resize', place);
  }
}

watch(open, (isOpen) => {
  listenWhileOpen(isOpen);
  if (!topLayer.value) return;
  if (isOpen) show();
  else hide();
});

onMounted(() => {
  topLayer.value = typeof bubble.value?.showPopover === 'function';
});

onBeforeUnmount(() => {
  listenWhileOpen(false);
  hide();
});
</script>

<template>
  <span
    ref="root"
    class="i9k-tooltip"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
    @pointerdown="onPointerDown"
    @pointercancel="onPointerCancel"
    @click="onClick"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
  >
    <slot v-bind="{ describedBy: id }" />
    <span
      :id="id"
      ref="bubble"
      class="i9k-tooltip__bubble"
      role="tooltip"
      :popover="topLayer ? 'manual' : undefined"
      :hidden="!topLayer && !open"
      :data-placement="placement"
      >{{ text }}</span
    >
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

/* Without popover support: above the trigger and aligned to its start edge in
   either reading direction. No display is set here, so the UA's [hidden] and
   closed-[popover] rules both hide the bubble; position: absolute makes it a
   block. */
.i9k-tooltip__bubble {
  --i9k-tooltip-bg: var(--theme-bg-color);

  position: absolute;
  z-index: 150;
  inset-block-end: calc(100% + var(--i9k-tooltip-gap));
  inset-inline-start: 0;
  width: max-content;
  max-width: min(var(--i9k-tooltip-width), calc(100vw - 2 * var(--spacing-8)));
  padding: var(--spacing-3) var(--spacing-4);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--i9k-tooltip-bg);
  box-shadow: var(--shadow-md);
  color: var(--text-color);
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.5;
  text-align: start;
  white-space: normal;
}

/* Inside a primary I9kSection the text turns white but the page background
   does not, so the bubble takes the section's green instead. */
:global(.i9k-section--primary) .i9k-tooltip__bubble {
  --i9k-tooltip-bg: var(--i9k-section-bg);
}

/* In the top layer: placed from the trigger's rect by the script. The UA
   centres an open popover in the viewport and clips its overflow, which would
   hide the hover bridge below. */
.i9k-tooltip__bubble:popover-open {
  position: fixed;
  inset: auto;
  top: var(--i9k-tooltip-y, 0);
  left: var(--i9k-tooltip-x, 0);
  margin: 0;
  overflow: visible;
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

.i9k-tooltip__bubble[data-placement='below']::after {
  inset-block-start: auto;
  inset-block-end: 100%;
}

.i9k-tooltip__bubble[hidden] {
  display: none;
}
</style>
