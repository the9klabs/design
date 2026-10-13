<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';

import type { I9kComponentSize } from '../types/components';

withDefaults(
  defineProps<{
    /** The photo. A square image; it is cropped to a circle. */
    src: string;
    /** The photo's alternative text. Pass '' when the person is named beside it. */
    alt: string;
    /** The bandana drawn over the eyes: a wide image with a transparent background. */
    bandanaSrc: string;
    size?: I9kComponentSize;
    /** 'lazy' for an avatar below the fold; the bandana then draws when the images arrive. */
    loading?: 'eager' | 'lazy';
  }>(),
  { size: 'md', loading: 'eager' },
);

const photo = useTemplateRef<HTMLImageElement>('photo');
const bandana = useTemplateRef<HTMLImageElement>('bandana');
const isPlaying = ref(false);

let photoLoaded = false;
let bandanaLoaded = false;
let hasPlayed = false;
let firstFrame = 0;
let secondFrame = 0;

function cancelReplay() {
  if (firstFrame) cancelAnimationFrame(firstFrame);
  if (secondFrame) cancelAnimationFrame(secondFrame);
  firstFrame = 0;
  secondFrame = 0;
}

// Taking the class off and putting it back two frames later is what makes
// the browser start the CSS animation again from its first keyframe.
function restart() {
  cancelReplay();
  isPlaying.value = false;

  firstFrame = requestAnimationFrame(() => {
    secondFrame = requestAnimationFrame(() => {
      isPlaying.value = true;
      firstFrame = 0;
      secondFrame = 0;
    });
  });
}

// The first draw waits for both images: a bandana that draws before its own
// file has arrived draws nothing.
function playOnce() {
  if (hasPlayed || !photoLoaded || !bandanaLoaded) return;
  hasPlayed = true;
  restart();
}

function onPhotoLoad() {
  photoLoaded = true;
  playOnce();
}

function onBandanaLoad() {
  bandanaLoaded = true;
  playOnce();
}

const hasLoaded = (image: HTMLImageElement | null) =>
  Boolean(image && image.complete && image.naturalWidth > 0);

// On a server-rendered page an image can finish before Vue hydrates, and its
// load event is then never heard.
onMounted(() => {
  if (hasLoaded(photo.value)) photoLoaded = true;
  if (hasLoaded(bandana.value)) bandanaLoaded = true;
  playOnce();
});

onBeforeUnmount(cancelReplay);
</script>

<template>
  <span :class="['i9k-bandana-avatar', `i9k-bandana-avatar--${size}`]" @pointerenter="restart">
    <span class="i9k-bandana-avatar__clip">
      <img
        ref="photo"
        class="i9k-bandana-avatar__photo"
        :src="src"
        :alt="alt"
        :loading="loading"
        decoding="async"
        @load="onPhotoLoad"
      />
      <img
        ref="bandana"
        :class="[
          'i9k-bandana-avatar__bandana',
          { 'i9k-bandana-avatar__bandana--playing': isPlaying },
        ]"
        :src="bandanaSrc"
        alt=""
        aria-hidden="true"
        draggable="false"
        data-bandana
        :loading="loading"
        decoding="async"
        @load="onBandanaLoad"
      />
    </span>
  </span>
</template>

<style scoped>
/* A round photo of a person with a bandana that draws itself across the
   eyes, once when the images load and again whenever a pointer enters. The
   bandana's place is in percentages of the photo, so it follows the size;
   the defaults fit the photo this was drawn for, and another photo moves it
   through the --i9k-bandana-avatar-bandana-* properties. */
.i9k-bandana-avatar {
  --i9k-bandana-avatar-size: 11rem;
  --i9k-bandana-avatar-bandana-top: 38%;
  --i9k-bandana-avatar-bandana-left: 35%;
  --i9k-bandana-avatar-bandana-width: 44%;
  --i9k-bandana-avatar-bandana-tilt: -2deg;

  position: relative;
  display: inline-block;
  flex: none;
  width: var(--i9k-bandana-avatar-size);
  height: var(--i9k-bandana-avatar-size);
  border-radius: var(--radius-circle);
  box-shadow:
    0 0 0 6px var(--glass-bg),
    0 8px 30px rgb(0 0 0 / 0.15);
  vertical-align: middle;
}

.i9k-bandana-avatar--sm {
  --i9k-bandana-avatar-size: 8rem;
}

.i9k-bandana-avatar--lg {
  --i9k-bandana-avatar-size: 14rem;
}

.i9k-bandana-avatar__clip {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: var(--radius-circle);
}

.i9k-bandana-avatar__photo {
  display: block;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  border: 3px solid var(--primary-color);
  border-radius: var(--radius-circle);
  object-fit: cover;
}

/* `left`, not an inline-start offset: the photo does not mirror in a
   right-to-left page, so neither may the bandana. */
.i9k-bandana-avatar__bandana {
  position: absolute;
  top: var(--i9k-bandana-avatar-bandana-top);
  left: var(--i9k-bandana-avatar-bandana-left);
  width: var(--i9k-bandana-avatar-bandana-width);
  height: auto;
  opacity: 0;
  clip-path: polygon(0 0, 0 0, 0 16%, 0 34%, 0 52%, 0 69%, 0 86%, 0 100%, 0 100%);
  pointer-events: none;
  transform: rotate(var(--i9k-bandana-avatar-bandana-tilt));
  transform-origin: center;
  user-select: none;
}

.i9k-bandana-avatar__bandana--playing {
  animation: i9k-bandana-avatar-draw 2.35s ease-out both;
}

/* The clip grows from the left edge to a torn right edge, holds, then the
   whole bandana fades. */
@keyframes i9k-bandana-avatar-draw {
  0% {
    opacity: 1;
    clip-path: polygon(0 0, 0 0, 0 16%, 0 34%, 0 52%, 0 69%, 0 86%, 0 100%, 0 100%);
  }

  30% {
    opacity: 1;
    clip-path: polygon(
      0 0,
      100% 0,
      96% 16%,
      100% 34%,
      97% 52%,
      100% 69%,
      96% 86%,
      100% 100%,
      0 100%
    );
  }

  90% {
    opacity: 1;
    clip-path: polygon(
      0 0,
      100% 0,
      96% 16%,
      100% 34%,
      97% 52%,
      100% 69%,
      96% 86%,
      100% 100%,
      0 100%
    );
  }

  100% {
    opacity: 0;
    clip-path: polygon(
      0 0,
      100% 0,
      96% 16%,
      100% 34%,
      97% 52%,
      100% 69%,
      96% 86%,
      100% 100%,
      0 100%
    );
  }
}

/* No bandana at all: it is only ever seen moving. */
@media (prefers-reduced-motion: reduce) {
  .i9k-bandana-avatar__bandana,
  .i9k-bandana-avatar__bandana--playing {
    opacity: 0;
    animation: none;
  }
}
</style>
