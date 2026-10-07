# Nino polish: refined art, ambient life, mood beats and actions — design

Builds on [2026-09-11-nino-mascot-design.md](2026-09-11-nino-mascot-design.md). Everything that
spec promises consumers still holds unless this one says otherwise.

## 1. Summary

Nino works, but he looks unfinished. Apart from a blink he stands frozen. A change of expression
replaces the face in a single frame. Consumers have no way to make him react to an event. The art
itself is coarser than it needs to be.

This pass makes four additive improvements, each layered on the one before:

1. **Refined art** on a finer pixel grid, with the same identity.
2. **Ambient life**: breathing, an antenna pulse, irregular blinks, glances, and extra motion for
   some expressions.
3. **Mood beats**: a change of `expression` plays a short blink-and-hop, and the new face swaps in
   while his eyes are shut.
4. **Actions**: one-shot `wave`, `jump`, `nod` and `shake`, triggered with `play()`, plus a
   `talking` state.

### Goals

- Nino never looks frozen while `animated` is on.
- A mood change has a visible reaction beat instead of a snap.
- 9k.school can trigger reactions from its own events: wave on the login page, jump on a maze win,
  shake on a wrong password.
- Motion is **pixel-snappy**. Every movement is stepped (`steps(1, end)`) and translates by whole
  grid pixels, so nothing blurs at any size, like an 8-bit sprite.
- Existing consumers keep working with no code change. The six expressions, `look`, `size`
  (including `auto` nesting), `animated`, `label` and every `--i9k-nino-*` property keep their
  meaning.

### Non-goals

- Changing `I9kChat`. Wiring `talking` to its typing state is a follow-up.
- A declarative `action` prop. One-shots are imperative on purpose (see §6).
- Image files, animation libraries, or JS-driven frame loops. This stays inline SVG and CSS
  keyframes.
- Desynchronising several Ninos on one page.
- Pointer tracking. The original spec's non-goal still stands.

## 2. Art

### Grid

The viewBox stays `0 0 64 64` with `shape-rendering="crispEdges"`. The pixel unit drops from 4
user units to **2** (a 32×32 grid), so every coordinate and every motion offset is a multiple of 2.

The SVG gets `overflow: visible`, so a jump or a raised arm can leave the box. For a nested
`size="auto"` instance this means he can draw outside the tile the host gave him.

### Parts

| part                 | geometry (x, y, w, h or path)                            | fill                          |
| -------------------- | -------------------------------------------------------- | ----------------------------- |
| shadow               | `14,58,36,2`                                             | `currentColor` at 12% opacity |
| legs                 | `20,48,4,2` and `40,48,4,2`                              | body                          |
| feet                 | `16,50,12,6` and `36,50,12,6`                            | body                          |
| arms                 | `2,24,6,14` and `56,24,6,14`                             | body                          |
| antenna stem         | `30,4,4,4`                                               | body                          |
| antenna bulb         | `28,0,8,4`                                               | eye                           |
| head                 | `M10 8H54V10H56V46H54V48H10V46H8V10H10Z` (notched)       | body                          |
| screen               | `M14 12H50V14H52V42H50V44H14V42H12V14H14Z` (notched)     | screen                        |
| screen glint         | `14,14,4,2` and `14,16,2,2`                              | `--i9k-nino-glint`            |
| cheeks               | `14,32,4,2` and `46,32,4,2`, for faces that declare them | `--i9k-nino-cheek`            |
| eyes / brows / mouth | per expression (§3)                                      | eye / eye / mouth             |

### New custom properties

Both are overridable per instance, like the existing ones.

```css
--i9k-nino-cheek: color-mix(in srgb, var(--accent-color) 45%, transparent);
--i9k-nino-glint: color-mix(in srgb, var(--white-color) 22%, transparent);
```

### What consumers will see change

The screen is 4 units shorter, which makes room for the antenna. Faces are redrawn to fit it (§3).
No consumer code changes, but the 9k.school login page and 404 maze must be checked visually (§9).
When these changes reach 9k.school (through its `github:the9klabs/design` dependency), the maze's
Nino may draw his antenna and raised arms past his tile. That is intended.

## 3. Expressions

These are the same six names, redrawn on the 2-unit grid. Each face is one record:

```ts
interface NinoFace {
  eyes: NinoShape[]; // NinoShape = rect { x, y, width, height } | path { d }
  brows?: NinoShape[];
  cheeks?: boolean;
  mouth: string; // path data, unique per expression
  talkMouth?: string; // open-mouth frame; defaults to NINO_TALK_MOUTH
}
```

| expression    | eyes                                                                 | brows                                                            | mouth                                                  | cheeks |
| ------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------ | ------ |
| `idle`        | `18,16,12,12`, `34,16,12,12`                                         | —                                                                | `M18 32H22V34H42V32H46V36H44V38H40V40H24V38H20V36H18Z` | —      |
| `happy`       | arches `M20 20H28V22H30V28H26V24H22V28H18V22H20Z` and its +16 x twin | —                                                                | `M18 32H46V34H44V38H40V40H24V38H20V34H18Z`             | yes    |
| `thinking`    | squint `18,22,12,4`, open `34,14,12,12`                              | `18,18,10,2`, `34,10,12,2`                                       | `M32 34H42V38H32Z`                                     | —      |
| `worried`     | `20,22,8,8`, `36,22,8,8`                                             | two-step slant: `18,18,4,2`+`22,16,6,2`, `36,16,6,2`+`42,18,4,2` | `M20 40V36H24V34H40V36H44V40H40V38H24V40Z`             | —      |
| `surprised`   | `18,14,12,16`, `34,14,12,16`                                         | —                                                                | `M28 34H36V36H38V40H36V42H28V40H26V36H28Z`             | —      |
| `eyes-closed` | lids `M18 22H20V24H28V22H30V26H18Z` and its +16 x twin               | —                                                                | `M22 34H26V36H38V34H42V38H38V40H26V38H22Z`             | yes    |

`NINO_TALK_MOUTH` is `M22 32H42V34H44V38H42V40H22V38H20V34H22Z`. No face overrides it yet. The
`talkMouth` field exists so that a face which needs its own open mouth gets one by adding data,
without a template change.

## 4. Layers

The template nests motion targets so that no two animations ever write the same element's
`transform`:

```
svg.i9k-nino
└─ g     stage  (:key = run)    ← re-created by every play(), so an action always starts at frame 0
   ├─ rect  shadow              ← jump scales it
   └─ g     figure              ← jump, mood hop, happy hop, thinking bob, worried shiver
      ├─ legs, feet
      └─ g  upper               ← breathe, nod, shake
         ├─ g arm (x=2)         ← jump raises it
         ├─ g arm (x=56)        ← wave, jump raise it
         ├─ antenna stem, bulb  ← bulb pulses (opacity)
         ├─ head, screen, glint, cheeks, brows
         ├─ g eyes              ← look (static translate) and look-around
         │  └─ eye shapes       ← blink, mood blink (scaleY)
         └─ mouth               ← talking (frame swap)
```

Anything that lifts Nino moves `figure`, so his legs and feet come with him. Lifting `upper` alone
would open a gap between his head and legs. `upper` only ever dips (breathing, nodding) or slides
sideways (shaking), and both keep the head attached.

Each layer has several possible animations. Only one runs on a layer at a time, decided by
precedence: **action > mood beat > expression motion > breathing**.

## 5. Ambient life and mood beats

All of the following match only under `.i9k-nino--animated`.

### Ambient (no action playing)

- **Breathing:** `upper` steps down 2 units and back on a 2.4s cycle, for every expression.
- **Blink:** an irregular ~13s cycle with two single blinks and one double blink, applied to
  every eye shape. `eyes-closed` does not blink.
- **Antenna pulse:** the bulb drops to 30% opacity briefly on a 3.2s cycle (1.2s while
  `thinking`).
- **Look-around:** only for `idle` with `look="center"`. The eye group glances start → end →
  centre once per 9s cycle. Under `[dir='rtl']` "start" and "end" swap, as `look` already does.
  An explicit `look` disables it.

### Expression motion (on `figure`, alongside breathing)

- `thinking`: the existing bob, now `steps(1, end)` and 2 units.
- `worried`: the existing shiver, now `steps(1, end)` and 2 units.
- `happy`: a 2-unit hop once every 3.2s.

### Mood beat

The component renders `shownExpression`, not the prop directly. When `expression` changes and
motion is allowed (§7):

1. Add `.i9k-nino--beat` for **240 ms**. The eyes squash to `scaleY(0.15)` and `figure` hops up
   2 units.
2. At **100 ms**, set `shownExpression` to the new value. The face swaps while the eyes are shut.
3. If `expression` changes again mid-beat, both timers restart and the latest value wins.

When motion is not allowed, `shownExpression` follows the prop synchronously. The initial render
always uses the prop, including on the server.

### Talking

A `talking: boolean` prop (default `false`) adds `.i9k-nino--talking`. The mouth alternates
between the face's `mouth` and its talk mouth on a 400 ms cycle, a frame swap rather than a scale.
Talking runs alongside any expression and any action.

## 6. Actions

```ts
export const I9K_NINO_ACTIONS = ['wave', 'jump', 'nod', 'shake'] as const;
export type I9kNinoAction = (typeof I9K_NINO_ACTIONS)[number];
export interface I9kNinoActionResult {
  action: I9kNinoAction;
  completed: boolean;
}
export interface I9kNinoExposed {
  play(action: I9kNinoAction): Promise<I9kNinoActionResult>;
}
```

| action  | duration | motion                                                                                                   |
| ------- | -------- | -------------------------------------------------------------------------------------------------------- |
| `wave`  | 1000 ms  | the x=56 arm (physical, not mirrored in RTL) raised 16 units, wiggling 2 units three times, then lowered |
| `jump`  | 800 ms   | crouch 2 → rise to −12 → land, with both arms up while airborne and the shadow shrinking with height     |
| `nod`   | 900 ms   | `upper` dips 4 units twice                                                                               |
| `shake` | 700 ms   | `upper` steps ±2 units horizontally three times                                                          |

`NINO_ACTION_DURATIONS` in `src/data/nino.ts` is the only place these numbers live. The component
writes the active duration to `--i9k-nino-action-duration` on the root, the keyframes read it, and
the resolve timer uses the same number.

### Contract

- **Start:** `play(action)` sets the active action, increments `run`, which re-keys `stage` so
  the animation always starts at frame 0 (repeating the same action restarts it), and adds
  `.i9k-nino--action-<name>`.
- **Finish:** after the duration it clears the action, emits `action-end` with
  `{ action, completed: true }`, and resolves with the same object.
- **Interrupt:** a `play()` during an action ends the earlier one first. It emits and resolves
  `{ action: <old>, completed: false }`, then starts the new one.
- **Motion off:** with `animated: false`, under reduced motion, or with no `window`, nothing
  animates. It emits `action-end` with `completed: true` and resolves on the next microtask.
- **Unmount:** clears timers and resolves a pending action with `completed: false`, without
  emitting.
- **Upper-body ambient motion pauses** while an action runs (breathing, expression motion,
  look-around). Blinks and the antenna pulse continue, and `expression`, `look` and `talking` stay
  in effect.

## 7. Motion off switches

There are three independent switches. Any one of them is sufficient:

1. `animated: false` removes `.i9k-nino--animated`, and every animation rule hangs off it.
2. `@media (prefers-reduced-motion: reduce)` sets `animation: none` on every animated selector.
3. In JS, `motionAllowed()` is `props.animated && !matchMedia('(prefers-reduced-motion:
reduce)').matches`, with a missing `matchMedia` counting as "allowed". It gates the mood beat
   and `play()`, so their timing and events follow the same rule as the CSS.

## 8. Structure and accessibility

- **`src/data/nino.ts`:** `NinoShape`, `NinoFace`, `NINO_FACES`, `NINO_TALK_MOUTH`,
  `NINO_BEAT` and `NINO_ACTION_DURATIONS`. It is data only, with no Vue import. The static
  body geometry (head, screen, arms, legs, antenna) is the same in every mood, so it stays
  written in the template, as it is today.
- **`src/types/components.ts`:** adds `I9K_NINO_ACTIONS`, `I9kNinoAction`,
  `I9kNinoActionResult` and `I9kNinoExposed`. All four are re-exported from `src/index.ts`.
- **`src/components/I9kNino.vue`:** props (`talking` added), the `action-end` emit,
  `defineExpose({ play })`, the mood-beat watcher, and the scoped CSS.
- **Accessibility:** unchanged. `label` gives `role="img"` and a `<title>`; without one he is
  `aria-hidden`. Nothing flashes. The antenna pulse is slow, and the 2.5 Hz mouth swap covers a
  tiny area.

## 9. Testing and verification

`tests/I9kNino.test.ts`. These existing tests are updated on purpose, not loosened:

- The pixel-grid test now asserts multiples of **2**, and also covers the new parts and paths.
- The "brows only where declared" test now expects brows on `thinking` and `worried`.

New tests:

- **Cheeks:** they render only for `happy` and `eyes-closed`.
- **`talking`:** it adds the class and renders a talk-mouth frame.
- **Mood beat, using fake timers:**
  - The old face stays during the first 100 ms and the new face appears afterwards.
  - `.i9k-nino--beat` is removed at 240 ms.
  - The swap is synchronous with `animated: false` and with mocked reduced motion.
- **`play()`, using fake timers:**
  - Completion resolves and emits `{ completed: true }` after the action's duration.
  - It applies the action class and the duration property.
  - A second call emits `completed: false` for the first.
  - Repeating the same action re-keys `stage`.
  - It resolves immediately when motion is off.
  - On unmount, a pending action resolves with `completed: false`.
- **Look-around:** it applies only to `idle` with `look="center"`.
- **Compiled CSS:** every selector with an `animation` declaration outside the media query has a
  matching `animation: none` inside `prefers-reduced-motion`.

Package gates:

- `I9kComponentContracts` gets the new exports.
- `showcase/registry/I9kNino.ts` gets updated gotchas and an actions demo.
- `stories/I9kNino.stories.ts` gets `Actions` (buttons calling `play`), `Talking`, `AmbientLife`
  and an RTL glance story.
- `npm run check` passes.

Manual checks:

- Storybook in light/dark and LTR/RTL, at `sm`, `md` and `lg`.
- The 9k.school login page and 404 maze, with 9k.school's `@9klabs/design` dependency temporarily
  linked to this branch, to confirm the shorter screen and visible overflow look right. No
  consumer change is expected. 9k.school's `login-page.test.ts` asserts Nino's props, not his
  rendered classes, so the delayed face swap doesn't affect it.
