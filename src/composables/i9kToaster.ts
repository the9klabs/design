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
   * Milliseconds before auto-dismissal; `null` never. Defaults to 5000 for info and success,
   * `null` otherwise.
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
  unregisterHost(host: symbol): void;
  install(app: App): void;
}

export const I9K_TOASTER_KEY: InjectionKey<I9kToaster> = Symbol('i9k-toaster');
/** How many modal layers deep a toaster sits: 0 on the page, +1 inside each I9kModal. */
export const I9K_TOASTER_LAYER_KEY: InjectionKey<number> = Symbol('i9k-toaster-layer');

const DEFAULT_DURATION = 5000;
const isBrowser = typeof window !== 'undefined';

let sourceSeq = 0;

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
    const duration =
      input.duration !== undefined
        ? input.duration
        : variant === 'info' || variant === 'success'
          ? DEFAULT_DURATION
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

  function clear() {
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

  function unregisterHost(host: symbol) {
    const index = hosts.findIndex((entry) => entry.host === host);
    if (index !== -1) hosts.splice(index, 1);
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
 * nothing or the calling component unmounts.
 */
export function useI9kToastSource(
  source: () => I9kToastOptions | null | undefined | false,
  toaster: I9kToaster = useI9kToaster(),
): void {
  const ownId = `i9k-toast-source-${++sourceSeq}`;
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
