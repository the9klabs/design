import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migratedComponents = [
  ['I9kButton.vue', 'i9k-button'],
  ['I9kButtonGroup.vue', 'i9k-button-group'],
  ['I9kIconButton.vue', 'i9k-icon-button'],
  ['I9kField.vue', 'i9k-field'],
  ['I9kInput.vue', 'i9k-input'],
  ['I9kCheckboxGroup.vue', 'i9k-checkbox-group'],
  ['I9kRadioGroup.vue', 'i9k-radio-group'],
  ['I9kSelect.vue', 'i9k-select'],
  ['I9kPhoneInput.vue', 'i9k-phone-input'],
  ['I9kTextarea.vue', 'i9k-textarea'],
  ['I9kToast.vue', 'i9k-toast'],
  ['I9kAsciiEmoji.vue', 'i9k-ascii-emoji'],
  ['I9kLinkCard.vue', 'i9k-link-card'],
  ['I9kProfileCard.vue', 'i9k-profile-card'],
  ['I9kTimelineCard.vue', 'i9k-timeline-card'],
  ['I9kBadge.vue', 'i9k-badge'],
  ['I9kCluster.vue', 'i9k-cluster'],
  ['I9kGrid.vue', 'i9k-grid'],
  ['I9kPageContainer.vue', 'i9k-page-container'],
  ['I9kPanel.vue', 'i9k-panel'],
  ['I9kStat.vue', 'i9k-stat'],
  ['I9kText.vue', 'i9k-text'],
  ['I9kCollapsible.vue', 'i9k-collapsible'],
] as const;

describe('migrated component styles', () => {
  it.each(migratedComponents)('%s owns scoped %s styles', (fileName, className) => {
    const source = readFileSync(resolve('src/components', fileName), 'utf8');

    expect(source).toMatch(/<style\s+scoped>/);
    expect(source).toContain(`.${className}`);
  });
});
