export type I9kBadgeVariant = 'solid' | 'outline' | 'tag';

export type I9kComponentSize = 'sm' | 'md' | 'lg';

export type I9kGridColumns = 1 | 2 | 3 | 'auto';

export type I9kIconButtonVariant = 'secondary' | 'primary' | 'ghost';

export type I9kPanelVariant = 'default' | 'feature' | 'flat';

export type I9kTextVariant = 'body' | 'lede';

export type I9kTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

/**
 * Nino's expressions. Exported as a runtime array as well as a type so a
 * consumer can iterate the set (a picker, a story, a test) without keeping a
 * second copy that can drift from this one.
 */
export const I9K_NINO_EXPRESSIONS = [
  'idle',
  'happy',
  'thinking',
  'worried',
  'surprised',
  'eyes-closed',
] as const;

export type I9kNinoExpression = (typeof I9K_NINO_EXPRESSIONS)[number];

/**
 * Logical, not left/right: `start` and `end` follow the reading direction, so
 * a glance toward a field lands on the same side of the form in Arabic as in
 * English.
 */
export type I9kNinoLook = 'center' | 'up' | 'down' | 'start' | 'end';

/**
 * The shared size scale plus `auto`, which drops the component's own CSS sizing
 * so a host `<svg>` can place Nino with x/y/width/height instead. Spelled out
 * rather than composed from I9kComponentSize so the showcase's prop extractor
 * and its value guard can both read the full set of literals.
 */
export type I9kNinoSize = 'sm' | 'md' | 'lg' | 'auto';
