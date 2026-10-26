---
title: Notifications and dialogs
description: Raise toasts from one per-app toaster, interrupt with a modal, and let the two work together without lost or repeated announcements.
navTitle: Notifications and dialogs
---

# Notifications and dialogs

<p class="docs-lede">Notifications appear in one place: a toaster at the top of the viewport. Dialogs interrupt the page with a modal. The two are built to work together, so a toast raised while a modal is open is still seen and announced.</p>

<DocsPageActions />

## Pick the right component

| You want to…                                                        | Use                                                  |
| ------------------------------------------------------------------- | ---------------------------------------------------- |
| Report the result of an action: saved, sent, failed                 | A toast, through [`I9kToaster`](/components/toaster) |
| Show standing status in the page, such as "This course is archived" | [`I9kToast`](/components/toast), in the page flow    |
| Interrupt for a focused task, such as an edit form                  | [`I9kModal`](/components/modal)                      |
| Explain a control on hover or focus                                 | [`I9kTooltip`](/components/tooltip)                  |
| Announce something site-wide above the navigation                   | [`I9kAnnouncementBar`](/components/announcement-bar) |

Never show the same message both ways. A toast replaces an inline banner for an action's result.

## Set up the toaster

Install one store per app and render one toaster at the root, **before** the page content in the
tree. A toaster never announces a toast raised before its own setup ran, so one rendered below the
page would show, but not announce, a toast the page raised while setting up.

```ts
// main.ts
import { createI9kToaster } from '@9klabs/design';

app.use(createI9kToaster({ labels: { region: 'Notifications', dismiss: 'Dismiss' } }));
```

```vue
<!-- App.vue -->
<template>
  <I9kToaster />
  <RouterView />
</template>
```

Translate through the store, not through props. Its `labels` object is reactive; assign its fields
when the locale changes:

```ts
const toaster = useI9kToaster();
Object.assign(toaster.labels, { region: t('notifications.region'), dismiss: t('dismiss') });
```

## Raise a toast

**From state you already have.** `useI9kToastSource` follows a getter: the toast shows while it
returns options, updates when they change, and goes away when it returns `null` or the component
unmounts.

```ts
const error = ref<string | null>(null);

useI9kToastSource(() =>
  error.value ? { id: 'login', variant: 'error', message: error.value } : null,
);

async function signIn() {
  error.value = null; // clear first, so the same failure twice shows twice
  try {
    await login();
  } catch (failure) {
    error.value = 'Those details did not match.';
  }
}
```

**Imperatively.** `useI9kToaster()` returns the store:

```ts
const toaster = useI9kToaster();
const id = toaster.show({ variant: 'success', message: 'Changes saved.' });
toaster.dismiss(id);
```

A toast is plain text. `info` and `success` dismiss themselves after five seconds. `warning` and
`error` stay until dismissed, since a reader may need time to act on them. Showing a toast with an
`id` already on screen replaces it rather than stacking a duplicate.

## Open a modal

The parent owns `open`. The close button and Escape only ask to close, by emitting
`update:open(false)`. The modal closes when you set `open` to `false`, and focus returns to
whatever opened it.

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { I9kButton, I9kInput, I9kModal } from '@9klabs/design';

const open = ref(false);
const title = ref('');
const saving = ref(false);
</script>

<template>
  <I9kButton @click="open = true">Edit module</I9kButton>

  <I9kModal
    v-model:open="open"
    title="Edit module"
    description="Both languages are required."
    :dismissible="!saving"
  >
    <form id="edit-module" @submit.prevent="save">
      <I9kInput v-model="title" label="Title" autofocus />
    </form>
    <template #footer>
      <I9kButton @click="open = false">Cancel</I9kButton>
      <I9kButton variant="primary" type="submit" form="edit-module">Save</I9kButton>
    </template>
  </I9kModal>
</template>
```

::: tip Three behaviors to rely on

- Clicking the backdrop never closes a modal, so a stray click cannot lose an unsaved form.
- The body and footer render only while open, so a form inside starts fresh every time. Put
  `autofocus` on its first field.
- Set `dismissible` to `false` while a save is in flight, so it cannot be closed halfway.
  :::

## Toasts and modals together

An open `I9kModal` renders a toaster of its own inside the dialog, one layer above the page's. Only
the deepest one shows toasts, so a toast raised while the modal is open is readable, announced and
dismissable above the inert page. `I9kSidebarLayout`'s drawer does the same on narrow screens.
There is nothing to wire up.

Raise the result of a modal's task in the same tick you close it, in either order:

```ts
async function save() {
  saving.value = true;
  await updateModule(title.value);
  saving.value = false;
  open.value = false;
  toaster.show({ variant: 'success', message: 'Module saved.' });
}
```

The page's toaster shows that toast and announces it once the dialog has closed. A toast the modal
already announced is never announced again by the page.

::: warning Keep modals out of the green section
An `I9kModal` placed inside an `I9kSection variant="primary"` inherits its re-mapped colors and turns
translucent. Render the modal outside the section.
:::
