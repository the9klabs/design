/**
 * 8-bit sound effects, synthesised with Web Audio so there is no sound file to ship.
 *
 * Browsers keep audio off until the visitor has interacted with the page, and a hover is not an
 * interaction: until the first click, tap or key press nothing plays, and `unlock` is what that
 * first gesture calls.
 */

/** A melody is a list of semitone steps from a root note, one short note each. */
export type Melody = readonly number[];

/** The chime: a major arpeggio that climbs an octave. */
export const CHIME: Melody = [0, 4, 7, 12];

/** Nino's note, which he chimes in on ismail9k.com's About page and plays his maze in. */
export const NINO_NOTE_HZ = 783.99;

const NOTE_SECONDS = 0.05;
const VOLUME = 0.04;
// A resume the browser grants long after it was asked for, on some later gesture, must not replay
// every sound requested in the meantime at once.
const STALE_RESUME_MS = 250;

export interface Chiptune {
  unlock: () => void;
  play: (rootHz: number, melody?: Melody) => void;
  dispose: () => void;
}

export interface ChiptuneOptions {
  createContext: () => AudioContext | undefined;
  /** Whether the visitor has already interacted with the page. */
  hasBeenActive: () => boolean;
  now?: () => number;
}

export function createChiptune({
  createContext,
  hasBeenActive,
  now = Date.now,
}: ChiptuneOptions): Chiptune {
  let context: AudioContext | undefined;

  function ensureContext() {
    context ??= createContext();
    return context;
  }

  function schedule(audio: AudioContext, rootHz: number, melody: Melody) {
    const start = audio.currentTime;
    melody.forEach((semitones, index) => {
      const noteStart = start + index * NOTE_SECONDS;
      const noteEnd = noteStart + NOTE_SECONDS;
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();

      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(rootHz * 2 ** (semitones / 12), noteStart);
      gain.gain.setValueAtTime(0, noteStart);
      gain.gain.linearRampToValueAtTime(VOLUME, noteStart + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);

      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(noteStart);
      oscillator.stop(noteEnd);
    });
  }

  function unlock() {
    const audio = ensureContext();
    if (audio?.state === 'suspended') {
      // Browsers that still refuse leave the promise pending or rejected.
      audio.resume().catch(() => {});
    }
  }

  function play(rootHz: number, melody: Melody = CHIME) {
    // Starting a context before any interaction only earns a console warning.
    if (!context && !hasBeenActive()) return;

    const audio = ensureContext();
    if (!audio) return;

    if (audio.state === 'running') {
      schedule(audio, rootHz, melody);
      return;
    }

    // The gesture that unlocks audio is often the one that asked for this sound, and resuming
    // takes a moment, so wait for it rather than drop the very first sound.
    const requestedAt = now();
    audio
      .resume()
      .then(() => {
        if (now() - requestedAt <= STALE_RESUME_MS) schedule(audio, rootHz, melody);
      })
      .catch(() => {});
  }

  function dispose() {
    context?.close().catch(() => {});
    context = undefined;
  }

  return { unlock, play, dispose };
}
