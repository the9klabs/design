# Smooth motion for Nino — design

Intent-Issue: #23 — https://github.com/the9klabs/design/issues/23

Builds on [2026-10-07-nino-polish-design.md](2026-10-07-nino-polish-design.md) and
[2026-09-11-nino-mascot-design.md](2026-09-11-nino-mascot-design.md). Everything those specs
promise consumers still holds unless this one says otherwise. This document was written unattended
from the issue and the code; §2 lists every decision made on the owner's behalf.

## 1. Summary

Nino moves like a sprite: every keyframe in `src/components/I9kNino.vue` is `steps(1, end)`, so an
expression change cuts, a glance jumps one cell, a blink snaps shut and open, breathing is a 2-unit
hiccup every 1.2 s, and in most moods he is still between blinks. Next to a generated avatar such
as Blobatar (https://blobatar.dev/), which eases everything, he looks stiff.

This pass keeps Nino's art, structure, API and timing contract and changes **how he gets from one
pose to the next**: every stepped keyframe becomes an eased one, the mood change becomes a
two-phase morph that squashes the old face shut and opens the new one, a `look` change glides, and
ambient life (breathing, blink, antenna, idle glance) runs continuously and smoothly in every
mood. Blobatar's `motion.css` is the reference for the feel — its curves and durations are adopted
where they fit — but none of its code is used.

### Goals

- Nino's movements are very smooth. No `steps()` timing function remains in his stylesheet.
- A mood change reads as one coordinated beat (eyes and mouth squash shut, the face swaps while
  nothing can be seen cutting, everything opens into the new face), about 0.3 s long.
- Nino is never still while `animated` is on: he breathes continuously in every mood.
- Every resting pose is exactly as drawn today, on the two-unit grid, so a still Nino (reduced
  motion, `animated: false`, the server render) is pixel for pixel unchanged.
- The public API is unchanged: props, `play()`, `action-end`, action durations, class names a
  consumer may already target (`i9k-nino--<expression>`, `i9k-nino--look-*`, `i9k-nino--beat`,
  `i9k-nino--acting`, `i9k-nino--action-*`, `i9k-nino--talking`), and every `--i9k-nino-*` colour.

### Non-goals

- Using Blobatar's code or depending on the `blobatar` package. Its motion is tied to its own
  parametric pose channels and registered custom properties; Nino's faces are paths that cannot be
  interpolated. Ideas and numbers are borrowed, not code.
- Anti-aliasing Nino. `shape-rendering="crispEdges"` stays (see §4).
- A hover response. Blobatar ramps its amplitude on hover and is still otherwise; Nino is a mascot
  who must be alive on a phone's sign-in page with no pointer, so his ambient motion is always on,
  which is Blobatar's `always` mode. No new prop.
- JavaScript-driven frame loops, the Web Animations API, image files or animation libraries. This
  stays CSS keyframes and transitions on inline SVG.
- Morphing path data between faces. Each expression keeps its own drawn eyes, brows and mouth.
- The maze's tile-to-tile movement. `I9kNinoMaze` in this repository and `NinoMaze.vue` in
  9k.school both move Nino between tiles with `transition: transform 140ms steps(2, end)`; that is
  the board's motion, not Nino's, and a grid game stepping tile to tile is a convention of its own.
  It is a one-line follow-up in each repository if the owner wants it eased too.
- Changing 9k.school. It receives this through its `github:the9klabs/design` dependency.

### Anti-goals

- A Nino who looks blurred or translucent at rest. Resting poses stay crisp and solid.
- A Nino who moves under `prefers-reduced-motion: reduce` or with `animated: false`, or whose face
  swaps late when motion is off.
- Motion that fights itself: two animations writing one element's `transform`. The layer rule from
  the polish spec (§4 there) still governs every new rule.

## 2. Decisions made for the owner

The issue's constraints are binding: very smooth motion, Blobatar as the reference, the change in
`@9klabs/design`, motion off under reduced motion and `animated: false`, light/dark and LTR/RTL
checks with a Storybook recording in the pull request. The issue's open questions, and the calls
this document makes beyond them:

| Question                                                | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Off-grid positions while a part moves?                  | **Yes, during travel only.** "Very smooth" cannot be had on a 2-unit grid: a 2-unit move has no intermediate grid position. Parts ease between grid cells and every keyframe at rest, and every drawn coordinate, stays a multiple of 2. The one exception already allowed (the shadow's `scaleX`) remains, and the worried tremor adds a second: it travels within ±1 unit and never rests off centre.                                                         |
| Which movements change?                                 | **All of them.** Every existing motion (mood change, glance, blink, breathing, antenna, idle glance, happy hop, thinking bob, worried shiver, hiding peek, talking, and the five one-shot actions) is eased. Leaving the actions stepped beside eased breathing would read as a bug. Of Blobatar's extras, breathing and saccades already exist on Nino and are made continuous; hover is a non-goal.                                                           |
| Does Nino move continuously when idle?                  | **Yes.** Breathing is a continuous alternate ease in every mood, the antenna fades rather than flicks, blinks keep their irregular 13 s cycle, and the idle glance keeps its hold-and-flick rhythm with eased flicks.                                                                                                                                                                                                                                           |
| Blobatar's code or only its feel?                       | **Only its feel.** See non-goals. Its curves and durations are adopted: 0.3 s for an expression change, `cubic-bezier(0.23, 1, 0.32, 1)` for anything that settles, `ease-in-out` for anything that sways, a fast `linear` loop for a tremor, held fixations with short flicks for the idle glance.                                                                                                                                                             |
| The 9k.school maze?                                     | **Out of scope**, with `I9kNinoMaze` here treated the same way. See non-goals.                                                                                                                                                                                                                                                                                                                                                                                  |
| The beat's hop (this document's call)                   | **Kept, eased.** The 2-unit hop is what gives the swap weight; Blobatar has no equivalent because it morphs. It becomes an ease-out rise and ease-in fall across the 300 ms.                                                                                                                                                                                                                                                                                    |
| How parts that only exist in one face enter and leave   | **Two beat phases** (§5) rather than one keyframe set, so a brow, cheek, hand or eye that mounts at the swap starts shut and opens, and one that leaves is already shut. This replaces the `--beat-even`/`--beat-odd` restart trick.                                                                                                                                                                                                                            |
| Arms and hands when hiding                              | **Fade over 120 ms** (`opacity`, not `visibility`) so raising and lowering the hands no longer pops the side arms in and out. The hands themselves squash shut and open with the rest of the face.                                                                                                                                                                                                                                                              |
| The caller's look and the idle glance share one element | **Split them with one wrapper group** (§7). CSS Transitions never start from, or survive, an animation created or cancelled in the same style change, so on one element a `look` change to or from `center` while idle would snap — the sign-in page's most common glance. The outer `eyes` group keeps the look and gains the transition; a new inner `glance` group carries the ambient glance. This is the one template change, raised by the builder check. |
| A mood change while `talking`                           | **The beat wins.** The mouth squashes shut and opens with the rest of the face and the talk frame hides for the 300 ms, then talking resumes. The alternative, the mouth flapping through the swap, is the one cut the morph exists to prevent, and the showcase recommends pairing `expression` changes with `talking`. Rule order puts talking before the beat so the beat's equal-specificity rules win (§6, §8).                                            |
| `NINO_BEAT` values                                      | **`{ swapAt: 120, duration: 300 }`** (was 100 / 240), Blobatar's 0.3 s. `NINO_BEAT` is exported from `src/data/nino.ts`, not from the package root, and the sky's tests read it by name, so nothing outside this repository depends on the old numbers.                                                                                                                                                                                                         |
| Action durations                                        | **Unchanged.** `NINO_ACTION_DURATIONS` stays `wave 1000, jump 800, nod 900, shake 700, dizzy 1200`; only the keyframes inside each action change. Consumers that await `play()` see the same timing.                                                                                                                                                                                                                                                            |

## 3. Motion vocabulary

Four timing functions, written as literals in the stylesheet and named in its header comment. Every
`animation` and `transition` in `I9kNino.vue` uses one of them; `steps()` is gone.

| name     | CSS                              | used for                                                                                                                                              |
| -------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `settle` | `cubic-bezier(0.23, 1, 0.32, 1)` | anything that arrives and stops: the open half of a morph, a glance or a flick, a rising hop or arm, the top of a jump. Blobatar's `transform` curve. |
| `shut`   | `ease-in`                        | anything that closes or falls: eyes and mouth shutting, a landing, an arm coming down.                                                                |
| `sway`   | `ease-in-out`                    | anything that goes back and forth: breathing, the bob, nod, shake and dizzy circles, the antenna dip, talking, the peek.                              |
| `linear` | `linear`                         | the worried tremor, and the holds between keyframes where nothing moves.                                                                              |

Durations, all in one place in the stylesheet's keyframes, except the two that JavaScript also
needs, which stay in `src/data/nino.ts` (`NINO_BEAT`, `NINO_ACTION_DURATIONS`):

| motion                            | timing                                                                                                                 |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| mood morph (§5)                   | 300 ms: shut 120 ms `shut`, open 180 ms `settle`                                                                       |
| glance to a new `look` (§7)       | 200 ms `settle` transition                                                                                             |
| blink (§6)                        | 13 s cycle kept; each blink shuts in 65 ms (`shut`) and opens in 105 ms (`settle`); two singles and a double per cycle |
| breathing (§6)                    | `upper` 0 → 2 units down, 2.4 s each way, `alternate`, `sway`                                                          |
| antenna (§6)                      | 3.2 s cycle (1.2 s while `thinking`); dips to 0.3 opacity over 5 % and back over 5 %, `sway`                           |
| idle glance (§6)                  | 9 s cycle kept; three fixations held ~700 ms each, reached by ~100 ms `settle` flicks                                  |
| happy hop (§6)                    | 3.2 s cycle; rises 4 units over 4 % (`settle`), falls over 5 % (`shut`)                                                |
| thinking bob (§6)                 | `figure` 0 → −2 units, 1.2 s each way, `alternate`, `sway`                                                             |
| worried tremor (§6)               | `figure`, 160 ms `linear` loop, four offsets within ±1 unit                                                            |
| hiding peek (§6)                  | 5 s cycle; hand drops 10 units over 4 %, holds 8 %, returns over 4 %, `sway`                                           |
| talking (§8)                      | 400 ms `sway` loop, two mouth frames trading height                                                                    |
| actions (§9)                      | durations unchanged; rises `settle`, falls `shut`, sways `sway`                                                        |
| arms and hands while hiding (§10) | 120 ms `sway` opacity transition                                                                                       |

## 4. The pixel grid during motion

The viewBox stays `0 0 64 64` with `shape-rendering="crispEdges"`, and every drawn coordinate stays
a multiple of 2, so a still Nino is unchanged and `tests/I9kNino.test.ts`'s grid test keeps
passing untouched.

While a part moves it is between cells. With `crispEdges` the browser snaps each edge to the
nearest device pixel without anti-aliasing, so an eased 2-unit move becomes a run of whole-device-
pixel steps at an eased pace (at `lg` on a 2× display a unit is 2.25 device pixels, so a 2-unit move
passes through four or five positions; at `sm` on a 1× display it is one). This is the trade this
document makes: the _timing_ is smooth everywhere, the _positions_ are as fine as the display allows,
and nothing is ever blurred. Switching to anti-aliased rendering was considered and rejected: it
would blur the resting pose at every size whose unit is not a whole number of device pixels (`md`
on 1×, `lg` on 2×), which is most of them.

Keyframe stops that are held (the top of a hop, a fixation, a raised arm) land on the grid. The
worried tremor's four offsets are the one motion whose stops are not multiples of 2; it is a
tremor, it never holds a stop, and it ends at rest.

## 5. The mood morph

The beat from the polish spec becomes a morph in two phases. The JavaScript still renders
`shownExpression` and still swaps it on a timer; what changes is the classes it sets and what the
CSS does with them.

### Phases

When `expression` changes and motion is allowed:

1. **Shut** — add `i9k-nino--beat` and `i9k-nino--beat-shut`. Over 120 ms (`shut`), every eye,
   brow, mouth frame and hand scales to `scaleY(0.1)` about its own centre, and the cheeks fade to
   `opacity: 0`. The figure starts its hop (below).
2. **Swap** — at `NINO_BEAT.swapAt` (120 ms), set `shownExpression` to the new value and replace
   `i9k-nino--beat-shut` with `i9k-nino--beat-open`.
3. **Open** — over 180 ms (`settle`), every eye, brow, mouth frame and hand scales from `scaleY(0.1)`
   to its drawn size, and the cheeks fade in. At `NINO_BEAT.duration` (300 ms) both beat classes
   are removed.

The two phases are what make mounting and unmounting parts safe:

- A part that exists in both faces (an eye that stays a `<rect>`, the mouth `<path>` whose `d`
  changes) runs shut, then open.
- A part that only the new face has (brows arriving with `thinking`, hands with `hiding`, cheeks
  with `happy`, an eye whose element type changes from `<rect>` to `<path>` and is therefore
  re-created by Vue) mounts while `--beat-open` is set, so its first frame is shut and it opens.
- A part that only the old face has is at `scaleY(0.1)` or `opacity: 0` when it is removed at the
  swap, so nothing visible disappears.

The shut animation uses `animation-fill-mode: forwards`, so a part stays shut between the end of its
120 ms and the moment the JavaScript timer swaps the face, however late that timer fires. The open
animation needs no fill: its end state is the part's natural transform.

### The hop

`.i9k-nino--beat .i9k-nino__figure` plays one 300 ms animation: `translateY(0)` → `translateY(-2px)`
at 40 % with `settle`, back to `0` at 100 % with `shut`. The figure persists through the swap, so
one animation covers the whole beat.

### Mid-beat changes, motion off, remounts

- A second `expression` change mid-beat clears both timers, sets the phase back to `shut` and
  restarts the 120 / 300 ms timers; the latest value wins, as today. The `--beat-even` / `--beat-odd`
  alternation is removed: switching from `open` back to `shut` is a different animation name, which
  restarts it, and a change that arrives during `shut` leaves the parts shut (forwards fill) until
  the new swap. The one visible cost is that a change during `open` snaps a half-open part to its
  natural size for one frame before shutting it again.
- With motion off (`animated: false`, reduced motion, no `window`), `shownExpression` follows the
  prop synchronously and no beat class is set, exactly as today. `animated` turning false mid-beat
  ends the beat and shows the pending face at once, as today.
- A `play()` that replaces an action already on screen re-keys `stage`, which remounts every part
  (a `play()` from rest keeps every element). Such a `play()` during a beat therefore restarts the
  current phase's animation on the remounted parts. That is a one-frame pop, in a case no consumer
  deliberately produces, and it is accepted.

### Data

`NINO_BEAT = { swapAt: 120, duration: 300 } as const` in `src/data/nino.ts`. The CSS uses the same
300 ms and the same 40 % (120 ms) split, and the comment beside each says so.

## 6. Ambient life

All under `.i9k-nino--animated`, with the same selectors as today (the layer each rides, the moods
each applies to, and the "only an idle Nino left at `center` glances" rule are unchanged); only
the keyframes and timing functions change.

- **Breathing** (`upper`): `translateY(0)` → `translateY(2px)`, 2.4 s, `sway`, `infinite alternate`.
  Continuous, in every mood.
- **Antenna** (`antenna`, opacity): held at 1, dips to 0.3 and back with `sway` over 5 % + 5 % of
  the cycle (160 ms each way at 3.2 s; 60 ms at 1.2 s while `thinking`).
- **Blink** (each `eye`, `scaleY`, 13 s): the cycle keeps its two single blinks and one double
  blink at the same places as today. Each shut is a 0.5 % segment (65 ms) with `shut` and each open a
  0.8 % segment (105 ms) with `settle`, from `scaleY(1)` to `scaleY(0.1)` and back; the double blink
  is two of these back to back. `eyes-closed` still does not blink.
- **Idle glance** (`glance`, `translateX`, 9 s, only `idle` + `look="center"`): centre is held to 60 %;
  a 1.1 % flick (`settle`) to start (`calc(var(--i9k-nino-dir) * -4px)`), held to 68 %; a flick to
  end (`calc(var(--i9k-nino-dir) * 4px)`), held to 76 %; a flick back to centre, held to 100 %.
  Saccades are ballistic — Blobatar is explicit that easing a saccade across its whole travel reads
  as swimming eyes — so the flicks stay short and the holds long.
- **Happy hop** (`figure`, 3.2 s): rest to 84 %, up to `translateY(-4px)` by 88 % with `settle`, down
  to 0 by 93 % with `shut`, rest to 100 %. 4 units rather than today's 2, because an eased 2-unit
  hop at `md` is a 1.5 px wobble.
- **Thinking bob** (`figure`): `translateY(0)` → `translateY(-2px)`, 1.2 s, `sway`,
  `infinite alternate`.
- **Worried tremor** (`figure`): 160 ms `linear` loop through four offsets within ±1 unit, for
  example `(1px, -0.5px)`, `(-1px, 0.5px)`, `(0.5px, 1px)`, `(-0.5px, -1px)`, returning to the first.
  It replaces the 0.6 s ±2-unit side-step, which reads as pacing rather than worry.
- **Hiding peek** (`hand--peek`, 5 s): rest to 72 %, down to `translateY(10px)` by 76 %, held to 84 %,
  back by 88 %, rest to 100 %, `sway`.

Rule order becomes: ambient, then expression motion, then **talking, then the beat** (swapped, so
the beat's mouth rules win over the talk loop at equal specificity, §8), then actions, then the
reduced-motion block last. Actions still come after the beat, so an action's `animation: none` on
`figure` still suppresses the beat hop and `'keeps acting while his mood changes'` still holds.

Two small snaps remain and are accepted: a `play()` that replaces an action already on screen
re-keys `stage` (a `play()` from rest keeps every element), which restarts every ambient loop at
its rest frame, so breathing settles by up to 2 units under the action's own first movement; and a
beat that replaces the thinking bob on `figure` starts from rest, so a mood change away from
`thinking` can begin with a 2-unit settle under the face squash. Both are ≤ 2 units, both happen
under a larger deliberate movement, and both existed as stepped jumps before this change. A third,
rarer one: a mood change that lands inside a blink replaces the blink with the beat's shut, so a
half-shut eye can open for one frame before shutting (rare, ≤ 1 frame, accepted).

## 7. The glance

The eye layer splits in two, the one template change in this design:

```
g.i9k-nino__eyes   data-nino-part="eyes"    ← the caller's look (static translate) + the transition
└─ g.i9k-nino__glance  data-nino-part="glance"  ← the idle look-around animation
   └─ eye shapes                               ← blink, beat (scaleY)
```

`.i9k-nino--animated .i9k-nino__eyes` gets `transition: transform 200ms cubic-bezier(0.23, 1, 0.32, 1)`.
A `look` change (the sign-in page moving his eyes to the field in focus) glides between cells, and
entering or leaving `hiding` (whose rule sets the eye group's `transform: none`) glides too. The
look positions, their RTL swap through `--i9k-nino-look-x`, and the `--i9k-nino-dir` sign are
unchanged. The idle look-around rule, its `animation: none` while acting, and its reduced-motion
twin move to `.i9k-nino__glance`; the `hiding` `transform: none` stays on `.i9k-nino__eyes` (the
glance never runs outside `idle`).

Why two groups: CSS Transitions compute the after-change style with the before-change animations
still in place, so an animation cancelled or created in the same style change neither feeds nor
survives a transition. On one element, `center → down` would cancel the look-around and snap, and
`down → center` would start a transition the newly created look-around's first frame overrides. On
two elements the outer group's transition never meets an animation. One residual: if `look` leaves
`center` while the inner group is parked at a fixation (about one sixth of its cycle), that 4-unit
glance offset snaps home as the look glides — a dart, which is how eyes move anyway.

## 8. Talking

The two mouth frames stay, and swap by trading height instead of visibility, so the mouth stays
solid and on-colour throughout:

- `.i9k-nino__mouth` (the face's own mouth): `scaleY(1)` → `scaleY(0.2)` at 50 % → `scaleY(1)`,
  400 ms, `sway`, infinite.
- `.i9k-nino__mouth--talk`: `scaleY(0.2)` → `scaleY(1)` at 50 % → `scaleY(0.2)`, same timing, with
  `visibility: visible` on every keyframe so the frame shows only while the animation runs. Its base
  rule keeps `visibility: hidden`, so a still or reduced-motion Nino who is talking shows his
  ordinary mouth, exactly as today.

Both mouths need `transform-box: fill-box; transform-origin: center`, which the beat (§5) needs
too; the rule that gives the eyes theirs grows to cover the mouth, brows and hands.

A mood change while talking: the beat's `--beat-shut` / `--beat-open` rules on `.i9k-nino__mouth`
match both mouth frames (the talk frame carries that class too) at the same specificity as the
talking rules, and they come later in the stylesheet, so they win. For the 300 ms the face's own
mouth squashes shut and opens with the eyes, and the talk frame, having lost the keyframes that made
it visible, falls back to `visibility: hidden`. Talking resumes from its first frame when the beat
classes leave.

## 9. Actions

Each one-shot keeps its duration, its layer and its shape; its keyframes gain in-betweens and
timing functions. Every action starts from rest and ends at rest (identity transform), so the
`stage` re-key and the end-of-action class removal never cut a part off mid-air.

| action  | eased motion                                                                                                                                                                                                                                                                                                                                                                 |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wave`  | the right-hand arm rises to `translate(0, -16px)` over the first 14 % (`settle`), wiggles to `translate(-2px, -18px)` and back three times with `sway`, and comes down over the last 14 % (`shut`)                                                                                                                                                                           |
| `jump`  | `figure`: crouch to `translateY(2px)` (`sway`), rise to `translateY(-12px)` (`settle`), fall to a `translateY(2px)` landing (`shut`), settle to 0 (`settle`); the arms rise to `translateY(-14px)` during the rise and come down during the fall; the shadow's `scaleX` follows the figure's height with the same timing functions (1.1 crouched, 0.6 at the top, 1 at rest) |
| `nod`   | `upper` dips to `translateY(4px)` and back twice, `sway`, ending at 0 with a rest segment                                                                                                                                                                                                                                                                                    |
| `shake` | `upper` swings between `translateX(-2px)` and `translateX(2px)` three times, `sway`, ending at 0                                                                                                                                                                                                                                                                             |
| `dizzy` | `upper` visits the same four points as today, `(2,0)`, `(0,2)`, `(-2,0)`, `(0,-2)`, three times with `sway` between them so the square becomes a circle, and eases home from 94 %                                                                                                                                                                                            |

`--i9k-nino-action-duration` still carries the length from `NINO_ACTION_DURATIONS`; the pause of
ambient motion on the layers an action uses is unchanged.

## 10. Hiding: arms and hands

The two rules that hide the side arms while hiding and the hands while acting switch from
`visibility: hidden` to `opacity: 0`, and `.i9k-nino--animated .i9k-nino__arm` and
`.i9k-nino--animated .i9k-nino__hand` get `transition: opacity 120ms ease-in-out`. Raising the hands
(entering `hiding`) now fades the arms out while the hands open with the face; a `play()` while
hiding cross-fades hands out and arms in for the action, and back after it. With motion off the
`opacity: 0` applies instantly, which looks exactly as `visibility: hidden` did. The cross-fade
holds in both directions because a `play()` from rest does not re-key the stage: the arms and
hands keep their elements, so the transition has a before-change style to start from.

## 11. Motion off

The three switches from the polish spec (§7 there) are unchanged, with one addition: the
reduced-motion block now also sets `transition: none` on every selector that declares a transition
(the eye group, the arms and the hands). `animated: false` already removes the class every
animation _and_ every new transition hangs off. With motion off, a `look` change and a hiding
change are instant and the chosen face shows exactly as drawn.

## 12. Structure, API and documentation

- **`src/components/I9kNino.vue`:** the `beatPhase` ref becomes `'shut' | 'open' | null` and
  replaces `beating` and the even/odd ref; classes gain `i9k-nino--beat-shut` / `i9k-nino--beat-open`
  and lose `i9k-nino--beat-even` / `i9k-nino--beat-odd`; the stylesheet's motion section is rewritten
  as §3–§11 describe. The template changes in one place: the eye shapes move into a new
  `<g class="i9k-nino__glance" data-nino-part="glance">` inside the existing `eyes` group (§7).
- **`src/data/nino.ts`:** `NINO_BEAT` becomes `{ swapAt: 120, duration: 300 }`; its comment names
  the two phases. Nothing else changes.
- **Public API:** none of `src/index.ts`, `src/types/components.ts` or the props change.
  `i9k-nino--beat-even/odd` were never documented; the showcase and story text never named them.
- **`AGENTS.md`:** the `I9kNino` convention bullet replaces "Every keyframe is `steps(1, end)` on the
  two-unit grid" with the new rule: motion is eased, never stepped; resting poses stay on the grid
  while parts travel between cells; a mood change is a two-phase beat so parts that mount at the
  swap start shut; every animated or transitioned selector is repeated in the reduced-motion block.
  Its layer list gains `glance` under `eyes`, with the reason (a transition and an animation on one
  element cannot hand over to each other).
- **`showcase/registry/I9kNino.ts`:** summary and agent prompt drop "stepped" and "like a sprite"
  and describe the eased motion and the 120 ms swap; the gotcha about the 100 ms delayed face
  becomes 120 ms.
- **`stories/I9kNino.stories.ts`:** comments updated; one new story, `MoodMorph`, cycles a Nino
  through every expression on a timer (about 1.6 s per mood) with a pause button, so the morph can
  be watched and recorded without clicking through controls.
- **Accessibility:** unchanged. Nothing flashes; the fastest loops are the 160 ms tremor (±1 unit)
  and the 400 ms talk, both tiny areas. No new ARIA.

## 13. Testing and verification

`tests/I9kNino.test.ts` is updated on purpose, never loosened:

- `'moves like a sprite: every animation is stepped, never eased'` inverts: the compiled
  stylesheet contains no `steps(`, `step-end` or `step-start` anywhere. (Every timing function
  then in use is one of §3's or the shorthand default, which is also eased.)
- `'stops every animation under prefers-reduced-motion'` also walks `transition` declarations:
  every selector with a non-`none` transition outside the media query has a `transition: none`
  twin inside it.
- `'sways in two-unit steps and ends the dizzy spell at rest'` becomes `'ends the dizzy spell at
rest'`: the even-number assertion goes, the last-frame-is-identity assertion stays.
- `'lifts his arms off his sides to hide, and lowers his hands to act'` reads `opacity: 0` instead of
  `visibility: hidden`.
- `'blinks again when a second mood arrives mid-beat'` becomes `'shuts again when a second mood
arrives mid-beat'`: after the swap the class is `--beat-open`; a second change puts `--beat-shut`
  back and removes `--beat-open`.
- `'runs a whole blink-and-hop for either beat phase'` becomes `'shuts and opens every face part
through the beat'`: the compiled CSS has a `--beat-shut` rule and a `--beat-open` rule for each of
  `__eye`, `__brow`, `__mouth`, `__hand` and `__cheek`, the shut rule's animation includes
  `forwards`, and `--beat .i9k-nino__figure` has the hop.
- `'blinks the old face shut and swaps the new one in behind its eyes'` also asserts the phase
  class before and after `NINO_BEAT.swapAt`, and that neither phase class remains at
  `NINO_BEAT.duration`.
- `'glances about only when idle and free to look'` looks for the glance rules on
  `.i9k-nino__glance` instead of `.i9k-nino__eyes`.
- New: `'glides his eyes to a new look'` — `.i9k-nino--animated .i9k-nino__eyes` has a `transition`
  on `transform`, and no rule outside the reduced-motion block puts an `animation` on
  `.i9k-nino__eyes` (the transition and the glance must never share an element).
- New: `'keeps the caller's look and his own glance on separate layers'` —
  `[data-nino-part="glance"]` is a descendant of `[data-nino-part="eyes"]` and contains both eyes.
- New: `'eases each blink shut and open'` — the `i9k-nino-blink` keyframes declare at least one
  `ease-in` and one `cubic-bezier(0.23, 1, 0.32, 1)` timing function.
- New: `'ends every one-shot at rest'` — for `wave`, `jump`, `jump-arms`, `nod`, `shake` and `dizzy`
  keyframes, the `100%`/`to` frame's transform numbers are all 0.

Every other test in the file (grid, parts, beat timing through `NINO_BEAT`, `play()` contract,
talking, SSR) passes unchanged. `tests/I9kNinoSky.test.ts` imports `NINO_BEAT` by name and keeps
passing with the new values. `tests/I9kChat.test.ts` and `tests/I9kNinoMaze.test.ts` assert props
and board state, not Nino's classes.

Package gate: `pnpm run check` passes (the worktree needs `pnpm install` first).

Manual checks, recorded for the pull request:

- Storybook `AmbientLife`, `MoodMorph`, `Actions`, `Talking`, `Hiding`, `LookingAround`,
  `LookingAroundRtl`, `GlancingRtl` and `Still`, in light and dark (the toolbar's colour mode), at
  `sm`, `md` and `lg`. A screen recording of `MoodMorph` and `Actions` goes in the pull request,
  with stills (light, dark, RTL) under `docs/visual-evidence/i9k-nino-smooth-motion/` following the
  sibling folders.
- Reduced motion (the OS setting, or DevTools' rendering emulation): no movement, instant swaps,
  the ordinary mouth while talking.
- Optionally, 9k.school's sign-in page with its `@9klabs/design` dependency linked to this branch:
  focusing email, password and submitting should glide and morph, with no consumer change.

## 14. Left to the builder

- Exact keyframe percentages within the durations and curves given in §3 and §6–§9, and the
  tremor's four offsets within ±1 unit.
- Whether the beat hop reads better at 2 or 4 units once seen beside the eased face; 2 is the
  default.
- The `MoodMorph` story's control layout.
- Any tuning of the open curve after the Storybook check, provided it stays a `settle` (ease-out)
  curve and the 120 / 300 ms split in `NINO_BEAT` is untouched.
