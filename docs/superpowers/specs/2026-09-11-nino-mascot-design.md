# Nino, the 9k mascot primitive — design

Intent issue: [ismail9k/9k.school#16](https://github.com/ismail9k/9k.school/issues/16)

## 1. Summary

`I9kNino` is the one place Nino (نينو) is drawn. It renders an inline SVG
pixel character built from nothing but rectangles and one mouth path — no
image files, no icon font, no external art — so it inherits theme tokens,
scales to any size, and stays crisp at 16 px.

The consuming experiences (9k.school's 404 maze and its login page) get a
character, a closed set of expressions, and a gaze direction. They do not get
to reinvent the face.

### Goals

- One base appearance, recognisable at small sizes and in both themes.
- An expression set wide enough for the two known consumers and for
  "communicates through expression and movement".
- Nestable inside a consumer's own `<svg>` (the 404 maze moves him tile by
  tile).
- Animated by default, static under `prefers-reduced-motion` and under an
  explicit `animated: false`.
- Decorative by default; accessible only when the consumer names him, since
  the name is localized ("Nino" / "نينو") and localization is not this
  package's job.

### Non-goals

- Localized strings of any kind. The consumer passes `label`.
- Game pieces: the 404 maze's bugs, tiles and walls are that page's art, not
  Nino's.
- A pointer-following mode driven by `mousemove`. `look` is a small closed
  set the consumer sets from its own state; a component that attaches global
  listeners would be the wrong default for a decorative primitive.

## 2. Construction

`viewBox="0 0 64 64"`, `shape-rendering="crispEdges"`, every coordinate a
multiple of 4 — a 16×16 pixel grid. Nothing is anti-aliased and nothing
drifts off-grid when scaled.

| part   | geometry                          | fill   |
| ------ | --------------------------------- | ------ |
| arms   | `0,20,8,16` and `56,20,8,16`      | body   |
| head   | `8,4,48,44`                       | body   |
| screen | `12,8,40,36`                      | screen |
| feet   | `16,48,12,8` and `36,48,12,8`     | body   |
| eyes   | per expression, always rectangles | eye    |
| brows  | per expression, may be absent     | eye    |
| mouth  | per expression, always one path   | mouth  |

The approved cues survive: two large square eyes (12×12 by default, a fifth
of the whole character each), a wide blocky smile, and flat geometric
construction. Colours come from component-local custom properties so a
consumer can retheme one instance without forking the component:

```css
--i9k-nino-body: var(--primary-text-color); /* theme-aware green */
--i9k-nino-screen: var(--dark-color);
--i9k-nino-eye: var(--accent-color);
--i9k-nino-mouth: var(--primary-text-color);
```

`--primary-text-color` is redefined by `html.dark`, so Nino lightens with the
theme without a single `:global(.dark …)` rule. The screen stays dark in both
themes on purpose — it is a screen.

## 3. Expressions

A closed set, exported as `I9K_NINO_EXPRESSIONS` so consumers can iterate it:

| expression    | eyes                           | mouth                          | for                               |
| ------------- | ------------------------------ | ------------------------------ | --------------------------------- |
| `idle`        | two full squares               | wide blocky grin               | default; the maze's walking state |
| `happy`       | low wide bars (reads as `^ ^`) | wider open grin                | the maze win                      |
| `thinking`    | asymmetric, raised             | small mouth pushed to one side | login submitting                  |
| `worried`     | shortened, with lowered brows  | frown (the grin mirrored)      | login failure; the maze loss      |
| `surprised`   | oversized squares              | small square mouth             | the maze being caught             |
| `eyes-closed` | thin bars                      | small gentle smile             | login password focus              |

Each expression is one `NinoFace` record — `eyes`, optional `brows`, and a
mouth path string. Adding an expression is adding a row, never editing the
template.

## 4. Gaze

`look` is `center | up | down | start | end`. It translates only the eye
group, never the head, which is what makes it read as a glance rather than a
turn.

`start` and `end` are logical, not left/right, because Nino has to work on an
Arabic page: the translation is negated under `[dir='rtl']`, matching how
`I9kTimelineCard` already handles direction in this package.

## 5. Motion

Animation is applied by class, never inline, so one media query turns all of
it off:

- `idle`/`happy`/`thinking`/`worried`/`surprised` blink on a long, irregular
  cycle. `eyes-closed` does not blink — the eyes are already shut.
- `thinking` adds a slow vertical bob.
- `worried` adds a short shiver.

Two independent off switches, both required by the consuming issues:

1. `animated: false` removes the `i9k-nino--animated` class, so no animation
   rule matches at all.
2. `@media (prefers-reduced-motion: reduce)` sets `animation: none` on every
   animated selector, regardless of the prop.

Either one leaves the chosen expression rendered exactly as its static
geometry — the expression is in the markup, never in a keyframe, so there is
nothing to "fall back" to.

## 6. Sizing and nesting

`size` is `sm | md | lg | auto`.

`sm`/`md`/`lg` set `--i9k-nino-size` (2rem / 3rem / 4.5rem) and apply it as
the SVG's inline and block size — the ordinary case, a mascot sitting in a
layout.

`auto` sets both to `auto` and is the escape hatch for embedding: a consumer
nesting `<I9kNino size="auto" x="40" y="80" width="40" height="40" />`
inside its own `<svg>` needs the SVG `x`/`y`/`width`/`height` attributes to
govern, and a CSS length would override them. The 404 maze is exactly this
case.

## 7. Accessibility

- `label` given → `role="img"` plus a `<title>`. The consumer supplies the
  localized name.
- `label` omitted → `aria-hidden="true"` and `focusable="false"`. A mascot
  with no name is decoration, and announcing "image" adds nothing.

There is no interactive state, no focus target, and no keyboard behaviour:
consumers that need those own them.

## 8. Testing

`tests/I9kNino.test.ts`:

- role/title when labelled; `aria-hidden` and no title when not.
- two eyes by default; brows only for the expression that declares them.
- every expression in `I9K_NINO_EXPRESSIONS` renders and produces a mouth
  path distinct from every other expression's.
- `look` and `size` and `animated` are reflected as state (modifier classes),
  and `animated: false` removes the animated class.
- a compiled-stylesheet test, in this package's existing postcss style,
  asserting that a `prefers-reduced-motion` block sets `animation: none` —
  the reduced-motion requirement is a contract, not a detail.

Package gates: `showcase/registry/I9kNino.ts` must exist (enforced by
`tests/showcaseRegistry.test.ts`), and that test's exported-component count
moves from 36 to 37 deliberately.
