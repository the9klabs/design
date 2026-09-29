import { defineComponent, provide } from 'vue';

import I9kButton from '../../src/components/I9kButton.vue';
import I9kToaster from '../../src/components/I9kToaster.vue';
import { createI9kToaster, I9K_TOASTER_KEY } from '../../src/composables/i9kToaster';
import type { ShowcaseEntry } from './types';

const notificationsDemoCode = `<!-- toaster = useI9kToaster(), from app.use(createI9kToaster()) -->
<I9kToaster />
<I9kButton @click="toaster.show({ variant: 'success', message: 'Changes saved.' })">
  Save
</I9kButton>
<I9kButton
  @click="toaster.show({
    id: 'save',
    variant: 'error',
    message: 'Could not save changes.',
    detail: 'تعذّر الاتصال بالخادم',
    detailLang: 'ar',
    detailDir: 'rtl',
  })"
>
  Fail to save
</I9kButton>`;

/**
 * The showcase has no app-level toaster, so this demo provides its own store,
 * exactly as `app.use(createI9kToaster())` would, and exposes it to the code
 * string as `toaster`.
 */
const NotificationsDemo = defineComponent({
  name: 'ShowcaseToasterDemo',
  components: { I9kButton, I9kToaster },
  setup() {
    const toaster = createI9kToaster();
    provide(I9K_TOASTER_KEY, toaster);
    return { toaster };
  },
  template: `<div class="showcase-demo-stage">${notificationsDemoCode}</div>`,
});

export const I9kToasterEntry: ShowcaseEntry = {
  name: 'I9kToaster',
  section: 'feedback',
  summary:
    'The one place notifications appear: a fixed stack at the top of the viewport that shows the toasts raised through a per-app store, announces each through its own live regions, dismisses info and success after five seconds and keeps warnings and errors until the user dismisses them.',
  agentPrompt: `Use I9kToaster from @9klabs/design to show notifications (saved, failed, sent) as floating toasts instead of banners in the page flow.

import { createI9kToaster, I9kToaster, useI9kToaster, useI9kToastSource } from '@9klabs/design';

Install once per app, then render exactly one <I9kToaster /> at the app root, before the page content in the tree (in the root layout, above the router view). A toaster never announces a toast raised before its own setup ran, so a toast raised during the setup of a page rendered above it is shown but never announced:

// main.ts (in Nuxt, a plugin: nuxtApp.vueApp.use(createI9kToaster({ labels })))
app.use(createI9kToaster({ labels: { region: 'Notifications', dismiss: 'Dismiss' } }));

<!-- App.vue -->
<I9kToaster />
<RouterView />

Translate through the store, not through props: an open I9kModal renders its own toaster, which reads only the store and its labels. \`toaster.labels\` is reactive and read-only as a whole — assign its fields (toaster.labels.region = t('notifications.region'), or Object.assign(toaster.labels, { region, dismiss })) when the locale changes; replacing the object is a type error and would not update anything.

Raise a toast from a ref you already have — the toast follows the ref: it shows while the getter returns options, is shown again when they change, and is dismissed when the getter returns null or the component unmounts:

const error = ref<string | null>(null);
useI9kToastSource(() => (error.value ? { id: 'login', variant: 'error', message: error.value } : null));

Two limits of useI9kToastSource:
- It re-shows only when the getter's value changes. Setting the ref to the text it already holds does nothing, so a repeated identical failure is not shown again: clear the ref at the start of each attempt (error.value = null), then set it on failure.
- It re-shows whenever anything else the getter reads changes, e.g. a t() call when the locale switches — which brings back a toast the user dismissed. Keep the getter to the ref, or accept that.

Or raise one imperatively:

const toaster = useI9kToaster();
toaster.show({ variant: 'success', message: 'Changes saved.' }); // returns the toast's id
toaster.dismiss(id); toaster.clear();

A toast (I9kToastOptions) is plain text:
- message: string (required)
- variant?: 'info' | 'success' | 'warning' | 'error' (default 'info')
- id?: string — showing a toast with an id already on screen replaces it, restarts its timer and announces it again, so a repeated failure never piles up.
- detail?: string — a second line, e.g. the server's message; detailLang?: string and detailDir?: 'ltr' | 'rtl' | 'auto' mark its language, e.g. an Arabic server message on an English page.
- duration?: number | null — milliseconds before it dismisses itself. Default 5000 for info and success; warning and error never dismiss themselves (null = never; ask for a sticky toast with null — a value no timer can hold, such as Infinity or anything above 2147483647, is treated as null too).

Behavior:
- At most three toasts at once (createI9kToaster({ limit }) changes it); the oldest drops when another arrives. Newest is last.
- Timers pause while the pointer is over the stack or focus is inside it. Every toast has a dismiss button.
- Placement: top of the viewport, clear of the safe-area inset; the inline-end corner (top right in English, top left in Arabic) from 40rem up, full width below. It sits above I9kNavigation (z-index 300).
- Screen readers: two visually hidden live regions (role="status" for info, success and warning; role="alert" for errors) are present from the first render and hold the newest toast's text, but only in the toaster that was showing toasts when it was raised (in any toaster when none was mounted yet); the visible toasts carry no role, so nothing is announced twice — not even by a page toaster left in the accessibility tree beside a custom role="dialog" aria-modal="true" host. Focus is never moved to a toast.
- Modals: an open I9kModal renders its own I9kToaster inside the dialog when a store is provided, one layer deeper, and only the deepest host shows the toasts — so a toast raised while a modal is open is readable, announced and dismissable above the inert page. I9kSidebarLayout's open drawer (an aria-modal dialog on a narrow screen) does the same. Nothing to wire up. A result may be raised in the same tick the modal closes (open.value = false and toaster.show(), in either order): the page's toaster shows it and announces it once the dialog has closed, and a toast the modal already announced is never announced again by the page.
- SSR-safe: the state lives in the store created per app, never in a module singleton, and timers only start in the browser.

Props (I9kToaster):
- toaster?: I9kToasterStore | null — the store to show (the type createI9kToaster() returns, exported under that name); defaults to the installed one.
- label?: string — the stack's accessible name; defaults to the store's labels.region ('Notifications').
- dismissLabel?: string — each dismiss button's name; defaults to labels.dismiss ('Dismiss').
Both override this toaster only; a modal's toaster still reads the store's labels, so set translations on the store.
- size?: 'sm' | 'md' | 'lg' (default 'md')

IMPORTANT: do not also render the same message inline with I9kToast — the notification replaces the banner. I9kToast alone stays for standing status in the page flow.`,
  gotchas: [
    'Render exactly one `<I9kToaster />` per app root, before the page content (above the router view): a toast raised during a page’s setup before the toaster’s own setup ran is shown but never announced. I9kModal and I9kSidebarLayout’s drawer add their own while open, so never place one inside either yourself.',
    '`useI9kToaster()` and `useI9kToastSource()` throw without an installed store: call `app.use(createI9kToaster())` (a Nuxt plugin) first. The store is per app, so server renders never share notifications.',
    'Warnings and errors are sticky: they stay until the user dismisses them or code dismisses them. A `useI9kToastSource()` toast also goes when its getter returns nothing or its component unmounts; a `toaster.show()` toast outlives the component that raised it, so dismiss it yourself. Pass `duration` to change that.',
    'Set labels on the store (`createI9kToaster({ labels })`, or assign `toaster.labels.region` / `.dismiss`), not as props on the page `<I9kToaster>`: an open I9kModal’s toaster reads only the store. `labels` is read-only as a whole, so assign its fields rather than the object.',
    '`useI9kToastSource()` re-shows only when the getter’s value changes: setting a ref to the text it already holds shows nothing, so clear it at the start of each attempt. A change in anything else the getter reads (a `t()` locale switch) re-shows a toast the user dismissed.',
    'Toasts are plain text (`message`, optional `detail`) — no slots, links or buttons inside them. Mark a detail in another language with `detailLang` and `detailDir`.',
    'A toaster never announces a toast raised before it appeared, so opening a modal does not repeat the page’s last notification, and only the toaster that was active when a toast was raised announces it, so the page does not repeat a toast raised in a modal, neither while the modal is open nor once it closes. A toast raised in the same tick a modal closes, which the modal never announced, is announced by the page once the dialog has closed: no need to wait for the close before raising a result.',
    'Do not render the same message inline as well; move it to the toaster.',
  ],
  demos: [
    {
      label: 'Success and error',
      code: notificationsDemoCode,
      render: NotificationsDemo,
    },
  ],
};
