import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const indexSource = readFileSync(resolve('src/index.ts'), 'utf8');
const tokenSource = readFileSync(resolve('src/styles/tokens.css'), 'utf8');

const phase3AExports = [
  "export type { I9kComponentSize, I9kIconButtonVariant, I9kTone } from './types/components';",
  "export type { I9kIconName } from './types/icons';",
  "export type { I9kCheckboxOption, I9kRadioOption } from './types/forms';",
  "export { default as I9kCheckboxGroup } from './components/I9kCheckboxGroup.vue';",
  "export { default as I9kButtonGroup } from './components/I9kButtonGroup.vue';",
  "export { default as I9kField } from './components/I9kField.vue';",
  "export { default as I9kIconButton } from './components/I9kIconButton.vue';",
  "export { default as I9kRadioGroup } from './components/I9kRadioGroup.vue';",
  "export { default as I9kSelect } from './components/I9kSelect.vue';",
  "export { default as I9kTextarea } from './components/I9kTextarea.vue';",
] as const;

const surfaceLayoutExports = [
  "export type { I9kBadgeVariant } from './types/components';",
  "export type { I9kGridColumns } from './types/components';",
  "export type { I9kPanelVariant } from './types/components';",
  "export type { I9kTextVariant } from './types/components';",
  "export { default as I9kBadge } from './components/I9kBadge.vue';",
  "export { default as I9kCluster } from './components/I9kCluster.vue';",
  "export { default as I9kGrid } from './components/I9kGrid.vue';",
  "export { default as I9kPageContainer } from './components/I9kPageContainer.vue';",
  "export { default as I9kPanel } from './components/I9kPanel.vue';",
  "export { default as I9kStat } from './components/I9kStat.vue';",
  "export { default as I9kText } from './components/I9kText.vue';",
] as const;

const collapsibleExports = [
  "export { default as I9kCollapsible } from './components/I9kCollapsible.vue';",
] as const;

const modalExports = ["export { default as I9kModal } from './components/I9kModal.vue';"] as const;

const sectionExports = [
  "export type { I9kSectionVariant } from './types/components';",
  "export { default as I9kSection } from './components/I9kSection.vue';",
] as const;

const learningFrameExports = [
  "export type { I9kCollapsibleVariant } from './types/components';",
  "export type { I9kBreadcrumbItem } from './types/components';",
  "export { default as I9kBreadcrumb } from './components/I9kBreadcrumb.vue';",
  "export { default as I9kSidebarLayout } from './components/I9kSidebarLayout.vue';",
] as const;

const glowExports = [
  "export type { I9kGlowPosition } from './types/components';",
  "export { default as I9kGlow } from './components/I9kGlow.vue';",
] as const;

const tabsExports = [
  "export type { I9kTabItem } from './types/components';",
  "export { default as I9kTabs } from './components/I9kTabs.vue';",
] as const;

const containerExports = [
  "export { default as I9kContainer } from './components/I9kContainer.vue';",
] as const;

const toasterExports = [
  "export type { I9kToastVariant } from './types/components';",
  `export type {
  I9kToaster as I9kToasterStore,
  I9kToasterLabels,
  I9kToastItem,
  I9kToastOptions,
} from './composables/i9kToaster';`,
  `export {
  createI9kToaster,
  I9K_TOASTER_KEY,
  I9K_TOASTER_LAYER_KEY,
  useI9kToaster,
  useI9kToastSource,
} from './composables/i9kToaster';`,
  "export { default as I9kToast } from './components/I9kToast.vue';",
  "export { default as I9kToaster } from './components/I9kToaster.vue';",
] as const;

const profileMenuExports = [
  "export { default as I9kAvatar } from './components/I9kAvatar.vue';",
  "export { default as I9kProfileMenu } from './components/I9kProfileMenu.vue';",
] as const;

const chatExports = [
  "export { default as I9kChat } from './components/I9kChat.vue';",
  "export { default as I9kChatBubble } from './components/I9kChatBubble.vue';",
  "export { default as I9kChatComposer } from './components/I9kChatComposer.vue';",
  "export { default as I9kChatOptions } from './components/I9kChatOptions.vue';",
] as const;

describe('shared component contracts', () => {
  it('exports the common component types', () => {
    expect(indexSource).toContain(
      "export type { I9kComponentSize, I9kIconButtonVariant, I9kTone } from './types/components';",
    );
  });

  it.each(phase3AExports)('exports %s', (statement) => {
    expect(indexSource).toContain(statement);
  });

  it.each(surfaceLayoutExports)('exports %s', (statement) => {
    expect(indexSource).toContain(statement);
  });

  it.each(collapsibleExports)('exports %s', (statement) => {
    expect(indexSource).toContain(statement);
  });

  it.each(modalExports)('exports %s', (statement) => {
    expect(indexSource).toContain(statement);
  });

  it.each(sectionExports)('exports %s', (statement) => {
    expect(indexSource).toContain(statement);
  });

  it.each(learningFrameExports)('exports %s', (statement) => {
    expect(indexSource).toContain(statement);
  });

  it.each(glowExports)('exports %s', (statement) => {
    expect(indexSource).toContain(statement);
  });

  it.each(tabsExports)('exports %s', (statement) => {
    expect(indexSource).toContain(statement);
  });

  it.each(containerExports)('exports %s', (statement) => {
    expect(indexSource).toContain(statement);
  });

  it.each(toasterExports)('exports %s', (statement) => {
    expect(indexSource).toContain(statement);
  });

  it.each(profileMenuExports)('exports %s', (statement) => {
    expect(indexSource).toContain(statement);
  });

  it.each(chatExports)('exports %s', (statement) => {
    expect(indexSource).toContain(statement);
  });

  it.each([
    ['--control-height-sm', '2rem'],
    ['--control-height-md', '2.5rem'],
    ['--control-height-lg', '3rem'],
    ['--control-font-size-sm', '0.875rem'],
    ['--control-font-size-md', '1rem'],
    ['--control-font-size-lg', '1.125rem'],
    ['--component-gap-sm', 'var(--spacing-4)'],
    ['--component-gap-md', 'var(--spacing-6)'],
    ['--component-gap-lg', 'var(--spacing-8)'],
    ['--container-width-sm', '42rem'],
    ['--container-width-md', '75rem'],
    ['--container-width-lg', '90rem'],
    ['--container-gutter', 'var(--spacing-13)'],
    ['--container-gutter-sm', 'var(--spacing-8)'],
  ])('declares %s as %s', (name, value) => {
    expect(tokenSource).toContain(`${name}: ${value};`);
  });
});
