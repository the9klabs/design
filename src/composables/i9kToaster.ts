import {
  computed,
  inject,
  onScopeDispose,
  reactive,
  shallowReactive,
  shallowRef,
  watch,
  type App,
  type InjectionKey,
} from 'vue';

import type { I9kToastVariant } from '../types/components';

export interface I9kToastOptions {
  id?: string;
  /** Defaults to `'info'`. */
  variant?: I9kToastVariant;
  message: string;
  detail?: string | null;
  detailLang?: string;
  detailDir?: 'ltr' | 'rtl' | 'auto';
  /**
   * Milliseconds before auto-dismissal; `null` never, and `null` is the way to ask for a sticky
   * toast. Defaults to 5000 for info and success, `null` otherwise. A value no timer can hold (not
   * finite, or above 2147483647, about 24.8 days) is treated as `null` rather than firing at once.
   */
  duration?: number | null;
}

export interface I9kToastItem {
  id: string;
  /** New on every show, so a replaced toast re-renders and is re-announced. */
  key: number;
  variant: I9kToastVariant;
  message: string;
  detail: string | null;
  detailLang?: string;
  detailDir?: 'ltr' | 'rtl' | 'auto';
  duration: number | null;
  /**
   * The host that was active when the toast was shown (`null` when none was
   * registered). Only that host announces it, so a page toaster left outside a
   * custom `aria-modal` dialog does not repeat what the dialog's toaster says.
   * When that host leaves before announcing it (a toast raised in the same tick
   * its modal closes), the store hands it to the host active after it.
   * Optional so items built by hand stay valid; the store always sets it.
   */
  readonly host?: symbol | null;
}

export interface I9kToasterLabels {
  region: string;
  dismiss: string;
}

export interface I9kToaster {
  readonly toasts: readonly I9kToastItem[];
  readonly latest: I9kToastItem | null;
  readonly activeHost: symbol | null;
  /** Reactive: change a label by assigning its field (`toaster.labels.region = …`), never the object. */
  readonly labels: I9kToasterLabels;
  show(options: I9kToastOptions): string;
  dismiss(id: string): void;
  clear(): void;
  pause(): void;
  resume(): void;
  registerHost(layer: number): symbol;
  /**
   * Removes a host. If the latest toast was raised in it and it never announced
   * it, the toast moves to the host active after it (in the browser a macrotask
   * later, once a closing modal dialog has stopped making the page inert).
   */
  unregisterHost(host: symbol): void;
  /** Used by I9kToaster: records that a host's live region has rendered the toast with this key. */
  markAnnounced(key: number): void;
  install(app: App): void;
}

export const I9K_TOASTER_KEY: InjectionKey<I9kToaster> = Symbol('i9k-toaster');
/** How many modal layers deep a toaster sits: 0 on the page, +1 inside each I9kModal. */
export const I9K_TOASTER_LAYER_KEY: InjectionKey<number> = Symbol('i9k-toaster-layer');

const DEFAULT_DURATION = 5000;
// setTimeout holds a signed 32-bit delay; anything longer fires at once.
const MAX_DURATION = 2 ** 31 - 1;
const isBrowser = typeof window !== 'undefined';

// Counted per store, like every other id, so concurrent server renders (one
// store each) give the same source the same id whatever else is rendering.
const sourceSeqs = new WeakMap<I9kToaster, number>();

interface Timer {
  handle: ReturnType<typeof setTimeout> | undefined;
  remaining: number;
  startedAt: number;
}

export function createI9kToaster(
  options: { limit?: number; labels?: Partial<I9kToasterLabels> } = {},
): I9kToaster {
  const limit = options.limit ?? 3;
  const toasts = shallowReactive<I9kToastItem[]>([]);
  const latest = shallowRef<I9kToastItem | null>(null);
  const hosts = shallowReactive<{ host: symbol; layer: number }[]>([]);
  const labels = reactive<I9kToasterLabels>({
    region: 'Notifications',
    dismiss: 'Dismiss',
    ...options.labels,
  });
  const timers = new Map<string, Timer>();
  let pauses = 0;
  let keySeq = 0;
  let idSeq = 0;
  // Keys only grow and only the latest toast is announced, so the highest key a
  // host has announced says whether the latest one was.
  let announcedKey = 0;
  let rehome: ReturnType<typeof setTimeout> | undefined;

  const activeHost = computed(() => {
    let active: { host: symbol; layer: number } | null = null;
    for (const entry of hosts) if (!active || entry.layer >= active.layer) active = entry;
    return active?.host ?? null;
  });

  function stopTimer(id: string) {
    const timer = timers.get(id);
    if (timer?.handle !== undefined) clearTimeout(timer.handle);
    timers.delete(id);
  }

  function runTimer(id: string, timer: Timer) {
    timer.startedAt = Date.now();
    timer.handle = setTimeout(() => dismiss(id), timer.remaining);
  }

  function dismiss(id: string) {
    stopTimer(id);
    const index = toasts.findIndex((toast) => toast.id === id);
    if (index !== -1) toasts.splice(index, 1);
    if (latest.value?.id === id) latest.value = null;
  }

  function show(input: I9kToastOptions): string {
    const variant = input.variant ?? 'info';
    const id = input.id ?? `i9k-toast-${++idSeq}`;
    const requested =
      input.duration !== undefined
        ? input.duration
        : variant === 'info' || variant === 'success'
          ? DEFAULT_DURATION
          : null;
    const duration =
      requested !== null && Number.isFinite(requested) && requested <= MAX_DURATION
        ? requested
        : null;
    const item: I9kToastItem = {
      id,
      key: ++keySeq,
      variant,
      message: input.message,
      detail: input.detail ?? null,
      detailLang: input.detailLang,
      detailDir: input.detailDir,
      duration,
      host: activeHost.value,
    };
    stopTimer(id);
    const index = toasts.findIndex((toast) => toast.id === id);
    if (index !== -1) toasts.splice(index, 1);
    toasts.push(item);
    while (toasts.length > limit) dismiss(toasts[0].id);
    latest.value = item;
    // Timers only run in the browser: a server render never dismisses anything.
    if (duration !== null && isBrowser) {
      const timer: Timer = { handle: undefined, remaining: duration, startedAt: 0 };
      timers.set(id, timer);
      if (pauses === 0) runTimer(id, timer);
    }
    return id;
  }

  function cancelRehome() {
    if (rehome !== undefined) clearTimeout(rehome);
    rehome = undefined;
  }

  function clear() {
    cancelRehome();
    for (const id of [...timers.keys()]) stopTimer(id);
    toasts.splice(0, toasts.length);
    latest.value = null;
  }

  function pause() {
    pauses += 1;
    if (pauses > 1) return;
    const now = Date.now();
    for (const timer of timers.values()) {
      if (timer.handle === undefined) continue;
      clearTimeout(timer.handle);
      timer.handle = undefined;
      timer.remaining = Math.max(0, timer.remaining - (now - timer.startedAt));
    }
  }

  function resume() {
    if (pauses === 0) return;
    pauses -= 1;
    if (pauses > 0) return;
    for (const [id, timer] of timers) if (timer.handle === undefined) runTimer(id, timer);
  }

  function registerHost(layer: number): symbol {
    const host = Symbol('i9k-toaster-host');
    hosts.push({ host, layer });
    return host;
  }

  // Moves the latest toast from a host that left before announcing it to the
  // host active now, under the same key so the shown item is not re-created.
  function rehomeFrom(host: symbol, item: I9kToastItem) {
    if (latest.value !== item || item.key <= announcedKey || item.host !== host) return;
    const moved: I9kToastItem = { ...item, host: activeHost.value };
    const index = toasts.findIndex((toast) => toast.key === item.key);
    if (index !== -1) toasts.splice(index, 1, moved);
    latest.value = moved;
  }

  function unregisterHost(host: symbol) {
    const index = hosts.findIndex((entry) => entry.host === host);
    if (index !== -1) hosts.splice(index, 1);
    const item = latest.value;
    if (!item || item.host !== host || item.key <= announcedKey) return;
    if (!isBrowser) {
      rehomeFrom(host, item);
      return;
    }
    // I9kModal calls dialog.close() a tick after it unmounts its toaster, and
    // until then the page is inert: a live region there would not be heard.
    cancelRehome();
    rehome = setTimeout(() => {
      rehome = undefined;
      rehomeFrom(host, item);
    }, 0);
  }

  function markAnnounced(key: number) {
    if (key > announcedKey) announcedKey = key;
  }

  const toaster: I9kToaster = {
    get toasts() {
      return toasts;
    },
    get latest() {
      return latest.value;
    },
    get activeHost() {
      return activeHost.value;
    },
    labels,
    show,
    dismiss,
    clear,
    pause,
    resume,
    registerHost,
    unregisterHost,
    markAnnounced,
    install(app: App) {
      app.provide(I9K_TOASTER_KEY, toaster);
    },
  };
  return toaster;
}

export function useI9kToaster(): I9kToaster {
  const toaster = inject(I9K_TOASTER_KEY, null);
  if (!toaster) {
    throw new Error('useI9kToaster() needs a toaster: app.use(createI9kToaster()).');
  }
  return toaster;
}

/**
 * Shows the toast `source` describes while it returns one, shows it again
 * whenever the returned value changes, and dismisses it when `source` returns
 * nothing or the calling component unmounts. A result may be raised in the same
 * tick an I9kModal closes: the page's toaster announces it once the dialog has
 * closed.
 */
export function useI9kToastSource(
  source: () => I9kToastOptions | null | undefined | false,
  toaster: I9kToaster = useI9kToaster(),
): void {
  const seq = (sourceSeqs.get(toaster) ?? 0) + 1;
  sourceSeqs.set(toaster, seq);
  const ownId = `i9k-toast-source-${seq}`;
  let shownId: string | null = null;
  watch(
    source,
    (options) => {
      const nextId = options ? (options.id ?? ownId) : null;
      if (shownId && shownId !== nextId) toaster.dismiss(shownId);
      shownId = options ? toaster.show({ ...options, id: nextId! }) : null;
    },
    { immediate: true },
  );
  onScopeDispose(() => {
    if (shownId) toaster.dismiss(shownId);
  });
}
