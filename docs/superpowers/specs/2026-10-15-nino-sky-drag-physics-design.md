# Nino's sky: drag, throw and dizzy — design

Builds on [2026-10-07-nino-polish-design.md](2026-10-07-nino-polish-design.md). Everything that
spec and `I9kNinoSky`'s current contract promise consumers still holds unless this one says
otherwise.

## 1. Summary

`I9kNinoSky` is the night-sky band that both `ismail9k.com` and `9k.school` render right after
`I9kFooter`. Today Nino drifts in a slow Lissajous figure and can only be booped. This change lets a
visitor pick him up, drag him anywhere in the window and throw him. He flies in the throw's
direction, slows down in "space", and bounces off the window edges. If he comes to rest inside the
sky, he drifts home to the middle. If he comes to rest above the sky, he swoops straight back into
it and plays a new **dizzy** reaction.

### Goals

- Dragging feels direct: Nino stays under the pointer at the point where it grabbed him, and never
  leaves the window.
- A throw's speed and direction come from how fast the pointer was moving when it let go.
- Nino never leaves the window. He bounces off its four edges and loses some speed on each bounce.
- Dropped or settled above the sky, he returns to it immediately and gets dizzy.
- Boop, keyboard access, the accessible name, server rendering and the `boop` event keep working
  as they do now. A drag is never a boop.
- With motion off, Nino can still be dragged, but there is no throw and no flight.

### Non-goals

- Gravity. The sky is space: Nino floats, as chosen during brainstorming.
- A keyboard way to throw Nino. Dragging is a pointer flourish on top of the boop, which stays
  fully keyboard-accessible.
- Collisions with page content, the stars or the planets.
- A prop to turn dragging off, or new events for the throw. Neither consumer asked for one; both
  can be added later without breaking anything.
- Changing `I9kFooter`. The sky is a sibling of the footer, and only the sky changes.

## 2. Behaviour

### States

Nino's flight element is in exactly one of four states:

| state       | where he is drawn                   | what moves him                                    |
| ----------- | ----------------------------------- | ------------------------------------------------- |
| `drifting`  | inside the sky (absolute, as today) | the existing drift, plus a home offset that fades |
| `dragging`  | in the window (fixed)               | the pointer                                       |
| `flying`    | in the window (fixed)               | velocity, air drag and bounces off window edges   |
| `returning` | in the window (fixed)               | a 300 ms ease-out tween back to his drift point   |

`dragging`, `flying` and `returning` together are **airborne**.

### Picking him up

- `pointerdown` on the Nino button (primary button only for a mouse) records the start point and
  captures the pointer. Nothing moves yet.
- Once the pointer has moved more than **4 px** from the start, it is a drag: Nino becomes
  airborne at his current on-screen position, with no jump. The offset between the pointer and his
  top-left corner is kept for the rest of the drag. His expression becomes `surprised`.
- If the pointer goes up before moving 4 px, it was a tap, and the `click` that follows boops him as
  today.
- After a real drag, the `click` that follows the `pointerup` is swallowed, so a drag never boops.
- A press on Nino while he is `flying` or `returning` catches him straight away, with no threshold:
  he becomes `dragging` from where he is, and his flight stops.
- A mouse move that arrives with no button held (the release happened outside the window) lets
  go of him, like `pointercancel`.
- The button gets `touch-action: none`, so a drag that starts on Nino does not scroll the page on
  a phone. Swipes anywhere else in the sky still scroll.

### Dragging

- Nino's top-left is the pointer position minus the grab offset, clamped to the window (see
  _Bounds_).
- The last **80 ms** of pointer samples (time, x, y) are kept for the release velocity.

### Releasing

- `pointerup` ends the drag. The release velocity is the displacement across the kept samples
  divided by their time span, with its magnitude capped at **3 px/ms**. With fewer than two samples,
  or a span of 0, it is zero.
- `pointercancel` and `lostpointercapture` end the drag the same way with zero velocity.
- With motion on, Nino starts `flying` with that velocity. With motion off, he lands immediately
  (see _Landing_).

### Flying

Every animation frame advances Nino by one step of `stepBody`:

- **Air drag:** velocity is multiplied by `exp(-dt / 700 ms)`, so a throw glides for roughly a
  second before stopping.
- **Bounces:** when the next position would cross a window edge, Nino is placed on that edge and
  the velocity component across it is reversed and multiplied by **0.7**. The other component keeps
  its value.
- **Settling:** once the speed drops below **0.05 px/ms**, he lands.
- **Tilt:** he leans with his horizontal speed, `clamp(vx × 8, -20, 20)` degrees, so a throw reads
  as a throw. The tilt is cosmetic and does not affect his bounds.
- The step is capped at 100 ms, the same cap the drift clock uses, so a tab that comes back from
  the background does not teleport him.

### Bounds

The window is `0 … documentElement.clientWidth` by `0 … window.innerHeight`, so the scrollbar is not
part of it. Nino's top-left stays within `0 … width − ninoWidth` and `0 … height − ninoHeight`,
using the button's untilted size. The bounds are re-read every frame, so resizing the window or
rotating a phone mid-flight keeps him inside it.

### Landing

Landing compares Nino's centre with the sky's current on-screen rectangle:

- **Centre above the sky's top edge → snap back.** He `returns`: a 300 ms ease-out tween from where
  he is to the point where his drift would draw him right now. Then he is `drifting` again with no
  home offset, his expression becomes `dizzy`, and his `dizzy` action plays. After 1500 ms his
  expression goes back to `idle`.
- **Anywhere else → drift home.** He is `drifting` again from exactly where he stopped. The home
  offset (his position relative to the sky's centre, minus where the drift would put him now)
  starts there and shrinks with `exp(-t / 1000 ms)`, so he is back on his usual path within about 3
  seconds without a jump. If he stopped outside the sky's box (for example below its bottom edge
  on a short page), the offset is clamped so he lands inside the box. His expression goes back to
  `idle`.

Because the check happens when he comes to rest, a throw that starts above the sky and ends inside
it is a normal landing. A drop above the sky with no speed comes to rest at once, and snaps back.

### Motion off

When `animated` is false or the visitor prefers reduced motion:

- Dragging still works, because it is direct manipulation, not decoration.
- Release lands immediately, without flying or a tween.
- Above the sky: Nino is put straight back at the still position (the centre), with the `dizzy`
  expression for 1500 ms. `I9kNino` already completes an action at once with motion off, so the
  `dizzy` action moves nothing.
- Anywhere else: Nino is put straight back at the centre, which is where a still sky keeps him.

### Interactions with what already exists

- **The motion loop** runs while Nino is airborne even if the sky has scrolled off screen, since he
  can be flying anywhere in the window. The tab-hidden check still pauses it. A tab hidden
  mid-flight resumes the flight where it stopped, and the 100 ms step cap keeps him from jumping.
- **The drift clock** keeps running while he is airborne, so the drift continues smoothly once he
  lands.
- **Boop** during the dizzy period works as today and replaces the dizzy face.
- **Look** keeps following the pointer while he drifts. While airborne, his look is `center`.
- **Unmount** while airborne stops the loop, releases pointer capture and clears every timer. The
  fixed element leaves with the component.
- **RTL:** the physics works in physical pixels and nothing is mirrored. The planets keep their
  current RTL placement.
- **Server render:** unchanged. The airborne class and inline transform only ever exist on the
  client.

## 3. How Nino escapes the sky

The sky has `overflow: hidden`, which clips anything positioned `absolute` inside it. While
airborne, the flight element gets `i9k-nino-sky__flight--airborne`, which sets
`position: fixed; top: 0; left: 0; translate: none`. The script writes his window position to
`transform`. A fixed element is positioned against the window, and `overflow: hidden` on an
ancestor does not clip it.

When he lands, the class comes off and his transform is written in sky coordinates again.

The button never moves in the DOM, so focus, the accessible name and server rendering are
unaffected.

**Known limitation:** an ancestor with `transform`, `filter`, `perspective`, `contain: paint` or
`will-change: transform` becomes the containing block for fixed elements. Inside one, Nino would
be bounded by that ancestor instead of the window. Neither consumer wraps the sky in one; the
showcase entry lists this as a gotcha.

The two alternatives, rejected during brainstorming:

- **Teleporting the button to `<body>` while airborne** moves a focused element around the DOM and
  complicates server rendering.
- **Removing `overflow: hidden`** still confines him to the sky's box, and lets the band add a
  horizontal scrollbar.

## 4. Physics module

Pure functions live in `src/composables/i9kNinoSky.ts`, next to `driftAt`, so they can be tested
without a DOM:

```ts
export interface NinoBody {
  x: number;
  y: number;
  vx: number;
  vy: number;
} // px, px/ms
export interface NinoBounds {
  width: number;
  height: number;
} // the room for his top-left corner
export interface PointerSample {
  t: number;
  x: number;
  y: number;
}

export function releaseVelocity(
  samples: PointerSample[],
  maxSpeed?: number,
): { vx: number; vy: number };
export function stepBody(body: NinoBody, dtMs: number, bounds: NinoBounds): NinoBody;
export function isSettled(body: NinoBody, threshold?: number): boolean;
export function homeOffsetAt(
  start: { x: number; y: number },
  elapsedMs: number,
): { x: number; y: number };
export function easeOutCubic(progress: number): number;
```

The tuning numbers (4 px threshold, 80 ms window, 3 px/ms cap, 700 ms drag, 0.7 restitution, 0.05
px/ms settle speed, 1000 ms home decay, 300 ms return, 1500 ms dizzy face) are exported constants
in the same file, so the tests and the component read the same values.

`I9kNinoSky.vue` owns the state machine, the pointer handlers and the DOM writes, and calls these
functions from its existing animation loop.

## 5. Dizzy, in `I9kNino`

Two additive changes to the public API.

### Expression `dizzy`

A new row in `NINO_FACES`, added to the end of `I9K_NINO_EXPRESSIONS`:

- **Eyes:** a square pixel spiral inside each eye's 12×12 box (`18,16` and `34,16`), drawn with
  2-unit strokes. The right eye mirrors the left, so the pair reads as swirling.
- **Mouth:** a wobbly zig-zag line, 2 units thick, across the usual mouth band.
- No brows, cheeks or hands.

It follows the rules the polish spec set for expressions: every coordinate is a multiple of 2, and
only the face changes.

### Action `dizzy`

Added to the end of `I9K_NINO_ACTIONS`, with **1200 ms** in `NINO_ACTION_DURATIONS`:

- The `upper` layer (head and arms) sways in a small circle: `(2, 0) → (0, 2) → (−2, 0) → (0, −2)`,
  three times, ending at rest. Each frame uses `steps(1, end)` on the two-unit grid.
- It moves only `upper`, the layer that `nod` and `shake` already own, so it never fights the
  figure's breathing.
- The selector is repeated in the reduced-motion block at the end of the stylesheet, like every
  other animated selector.

`play('dizzy')` follows the existing `play()` contract: it resolves with `{ action, completed }`
and emits `action-end`.

## 6. Testing

- **Physics unit tests (`tests/i9kNinoSkyMaths.test.ts`, beside the drift and sky maths):**
  - Release velocity from the samples, its cap, and fewer than two samples.
  - Air drag slows the body.
  - A bounce on each of the four edges reverses and damps the velocity, and the position stays in
    bounds.
  - The settle threshold.
  - The home offset decays toward zero.
  - The ease-out curve's end points.
- **`I9kNinoSky` component tests (`tests/I9kNinoSky.test.ts`):**
  - A pointer drag past the threshold followed by `click` does not boop or emit `boop`.
  - A tap under the threshold still boops.
  - Dropping him above the sky (with `animated: false`, which makes the result synchronous) shows
    the dizzy face.
  - Dropping him inside the sky does not.
  - While airborne the flight element carries the airborne class, and it loses it on landing.
  - Unmounting mid-drag leaves no running timers.
- **`I9kNino` tests:**
  - The `dizzy` expression renders its own eyes and mouth.
  - `play('dizzy')` resolves `completed: true` after 1200 ms and emits `action-end`.
  - The tests that pin the expression and action lists are updated deliberately.
- **Stories:** `I9kNino.stories.ts` picks up the new expression and action. `I9kNinoSky` gains a
  note on dragging.
- **Showcase:** `showcase/registry/I9kNino.ts` lists `dizzy`. `showcase/registry/I9kNinoSky.ts`
  documents the drag, and adds the containing-block limitation as a gotcha.
- **AGENTS.md:** one line under component conventions on how the sky's drag works and its
  containing-block caveat.
- **By hand, in Storybook:**
  - Throw him hard into each window edge.
  - Drop him above the sky.
  - Throw him from above the sky into it.
  - Resize the window mid-flight.
  - Repeat with reduced motion, in dark mode, and in RTL.
