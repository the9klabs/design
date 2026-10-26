import { onBeforeUnmount, onMounted } from 'vue';

import { createChiptune, type Melody } from '../utils/chiptune';

type ActivationNavigator = Navigator & { userActivation?: { hasBeenActive: boolean } };

/**
 * Chiptune sound effects for one component: the first click, tap or key press anywhere on the
 * page unlocks audio, and unmounting closes it. The unlock listens in the capture phase, so a key
 * press that also asks for a sound has started audio before its own handler runs.
 *
 * While `isEnabled` returns false nothing is played and no AudioContext is ever created, so a
 * muted component costs the page nothing.
 */
export function useI9kChiptune(isEnabled: () => boolean = () => true) {
  const chiptune = createChiptune({
    createContext: () => {
      const AudioContextClass =
        globalThis.AudioContext ??
        (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      return AudioContextClass ? new AudioContextClass() : undefined;
    },
    hasBeenActive: () =>
      (globalThis.navigator as ActivationNavigator | undefined)?.userActivation?.hasBeenActive ===
      true,
  });

  function unlock() {
    if (isEnabled()) chiptune.unlock();
  }

  onMounted(() => {
    window.addEventListener('pointerdown', unlock, { capture: true, passive: true });
    window.addEventListener('keydown', unlock, { capture: true });
  });

  onBeforeUnmount(() => {
    window.removeEventListener('pointerdown', unlock, { capture: true });
    window.removeEventListener('keydown', unlock, { capture: true });
    chiptune.dispose();
  });

  return (rootHz: number, melody?: Melody) => {
    if (isEnabled()) chiptune.play(rootHz, melody);
  };
}
