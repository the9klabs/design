export type I9kBadgeVariant = 'solid' | 'outline' | 'tag';

export type I9kComponentSize = 'sm' | 'md' | 'lg';

/**
 * Where I9kGlow sits. Logical like I9kNinoLook: `start` and `end` follow the
 * reading direction, so the glow mirrors in Arabic.
 */
export type I9kGlowPosition = 'top' | 'top-start' | 'top-end' | 'start' | 'end' | 'center';

export type I9kGridColumns = 1 | 2 | 3 | 'auto';

export type I9kIconButtonVariant = 'secondary' | 'primary' | 'ghost';

export type I9kPanelVariant = 'default' | 'feature' | 'flat';

export type I9kSectionVariant = 'default' | 'primary';

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

/** One destination in an I9kFooter column. */
export interface I9kFooterLink {
  id: string;
  label: string;
  /**
   * Site-relative (`/talks`) hrefs go through the footer's `linkComponent`;
   * anything else (`https:`, `mailto:`, protocol-relative `//host`) always
   * renders a plain anchor.
   */
  href: string;
  /** Opens in a new tab and shows a direction-aware arrow. */
  external?: boolean;
  /** Emphasised, for the one destination a column should lead with. */
  featured?: boolean;
  /** Decorative prefix such as an emoji; hidden from assistive technology. */
  emoji?: string;
}

/** A titled group of links in I9kFooter. */
export interface I9kFooterColumn {
  id: string;
  title: string;
  links: I9kFooterLink[];
}

/**
 * `card` is the bordered surface; `flush` drops the border and background for
 * a list of disclosures inside a panel or sidebar, where a card per item
 * would box the list in twice.
 */
export type I9kCollapsibleVariant = 'card' | 'flush';

/** One step of an I9kBreadcrumb trail. The last item is the current page. */
export interface I9kBreadcrumbItem {
  id: string;
  label: string;
  /** Rendered as a link on every item but the last. */
  href?: string;
}
