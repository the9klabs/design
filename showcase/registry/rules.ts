export const RULES: string[] = [
  'I9kInput names its visual scale prop `uiSize`, not `size`, so the native HTML `size` attribute stays available on the underlying input.',
  'Every component owns its appearance in `<style scoped>` and must not rely on global classes for its look.',
  'Components declare component-local custom properties on their root class and redefine them per size modifier, rather than consuming raw brand tokens for sizing.',
  'Sizes and tones come from the shared `I9kComponentSize` and `I9kTone` types. Do not redeclare those string unions per component.',
  'I9kButton renders a `<button>`, an `<a>`, or a caller-supplied component: pass `to` or `href` for a link, and `link-component="RouterLink"` in Vue Router apps.',
  'I9kIcon renders from the local `src/icons/paths.json` set. Add new icons to that file rather than inlining SVG in a component.',
  'Components emit legacy classes alongside their `i9k-` ones while the website migration is in progress. Do not remove a legacy selector or prop until its migration ledger row is complete.',
  'Import the shared stylesheet once, at the application entry: `@9klabs/design/base.css`. Each component imports its own styles; in a bundled app never add `@9klabs/design/style.css` beside it, which repeats every component rule.',
  'Any visual change needs checking in light and dark themes and in both LTR and RTL directions.',
  'Pixel accents (notched pixel blocks, `.i9k-pixel-corners`, `.i9k-numeric`, `--font-mono`) are only for progress and levels, achievements, numbers and identifiers, and an identity mark without a photo. Never use them for panels, cards, buttons, inputs, navigation, headings or body text, and never set Arabic text in `--font-mono`.',
];
