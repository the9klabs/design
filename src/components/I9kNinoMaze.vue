<script setup lang="ts">
import { computed, onMounted, ref, useId, watch } from 'vue';

import { useI9kChiptune } from '../composables/i9kChiptune';
import { NINO_MAZE_LABELS, NINO_MAZE_SOUNDS } from '../data/ninoMaze';
import type {
  I9kNinoExposed,
  I9kNinoExpression,
  I9kNinoMazeDifficulty,
  I9kNinoMazeLabels,
  I9kNinoMazeResult,
} from '../types/components';
import type { I9kIconName } from '../types/icons';
import {
  createNinoMazeState,
  formatI9kNinoMazeSeed,
  generateNinoMaze,
  moveNino,
  NINO_MAZE_DIRECTIONS,
  ninoMazeTiles,
  normalizeNinoMazeSeed,
  randomNinoMazeSeed,
  type NinoMazeDirection,
  type NinoMazePoint,
  type NinoMazeState,
} from '../utils/ninoMaze';
import I9kButton from './I9kButton.vue';
import I9kIconButton from './I9kIconButton.vue';
import I9kNino from './I9kNino.vue';

const props = withDefaults(
  defineProps<{
    /**
     * The maze to play; the same seed always builds the same maze. A string is hashed, so pass a
     * code through parseI9kNinoMazeSeed first. Omitted, the client picks a random one. Use
     * v-model:seed to follow New maze.
     */
    seed?: number | string | null;
    difficulty?: I9kNinoMazeDifficulty;
    /** Sound off. Use v-model:muted to follow the bar's toggle. */
    muted?: boolean;
    /** Merged over the English defaults. */
    labels?: Partial<I9kNinoMazeLabels>;
  }>(),
  { seed: null, difficulty: 'normal', muted: false, labels: () => ({}) },
);

const emit = defineEmits<{
  'update:seed': [seed: number];
  'update:muted': [muted: boolean];
  won: [result: I9kNinoMazeResult];
  caught: [result: I9kNinoMazeResult];
}>();

const TILE = 16;
const ICONS: Record<NinoMazeDirection, I9kIconName> = {
  up: 'arrowUp',
  down: 'arrowDown',
  left: 'arrowLeft',
  right: 'arrowRight',
};
// Arrow keys stay literal in both reading directions: a visitor pressing an arrow means the
// direction it points at, not a logical start or end.
const KEYS: Record<string, NinoMazeDirection> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
  W: 'up',
  S: 'down',
  A: 'left',
  D: 'right',
};

const titleId = `${useId()}-maze-title`;
const board = ref<HTMLElement | null>(null);
const ninoRef = ref<I9kNinoExposed | null>(null);

const text = computed<I9kNinoMazeLabels>(() => ({ ...NINO_MAZE_LABELS, ...props.labels }));

// Seed and sound are controlled-or-uncontrolled: an internal copy follows the prop and is what
// the bar's buttons change.
const currentSeed = ref<number | null>(
  props.seed === null ? null : normalizeNinoMazeSeed(props.seed),
);
watch(
  () => props.seed,
  (seed) => {
    if (seed !== null) currentSeed.value = normalizeNinoMazeSeed(seed);
  },
);

const isMuted = ref(props.muted);
watch(
  () => props.muted,
  (muted) => {
    isMuted.value = muted;
  },
);

const maze = computed(() =>
  currentSeed.value === null ? null : generateNinoMaze(currentSeed.value, props.difficulty),
);
const state = ref<NinoMazeState | null>(maze.value ? createNinoMazeState(maze.value) : null);
// A new seed or difficulty is a new maze, and a new maze is a fresh game.
watch(maze, (next) => {
  state.value = next ? createNinoMazeState(next) : null;
});

// Without a seed the server cannot pick one the client would agree with, so the server renders
// an empty board of the right shape and the client fills it in.
onMounted(() => {
  if (currentSeed.value === null) rollSeed();
});

const tiles = computed(() => maze.value ?? ninoMazeTiles(props.difficulty));
const viewBox = computed(() => `0 0 ${tiles.value.width * TILE} ${tiles.value.height * TILE}`);

const layout = computed(() => {
  const walls: NinoMazePoint[] = [];
  const floor: NinoMazePoint[] = [];
  maze.value?.rows.forEach((row, y) => {
    [...row].forEach((tile, x) => (tile === '#' ? walls : floor).push({ x, y }));
  });
  return { walls, floor };
});

const playable = computed(() => state.value?.status === 'playing');
const code = computed(() =>
  currentSeed.value === null ? '' : formatI9kNinoMazeSeed(currentSeed.value),
);

const ninoExpression = computed<I9kNinoExpression>(() => {
  if (!state.value) return 'idle';
  if (state.value.status === 'won') return 'happy';
  if (state.value.lastEvent === 'caught') return 'surprised';
  if (state.value.lastEvent === 'blocked') return 'worried';
  return 'idle';
});

const announcement = computed(() => {
  const labels = text.value;
  const current = state.value;
  if (!current) return labels.loading;
  switch (current.lastEvent) {
    case 'moved':
      return labels.moved({ moves: current.moves });
    case 'blocked':
      return labels.blocked;
    case 'caught':
      return labels.caught({ caught: current.caught });
    case 'won':
      return labels.won({ moves: current.moves });
    default:
      return labels.start;
  }
});

const playSound = useI9kChiptune(() => !isMuted.value);

function step(direction: NinoMazeDirection) {
  if (!state.value) return;
  const next = moveNino(state.value, direction);
  // Once Nino is home the board ignores input, and so does the sound.
  if (next === state.value) return;

  state.value = next;
  const sound = NINO_MAZE_SOUNDS[next.lastEvent];
  if (sound) playSound(sound.rootHz, sound.melody);

  const result = { seed: next.maze.seed, moves: next.moves, caught: next.caught };
  if (next.lastEvent === 'won') {
    emit('won', result);
    void ninoRef.value?.play('jump');
  } else if (next.lastEvent === 'caught') {
    emit('caught', result);
  } else if (next.lastEvent === 'blocked') {
    void ninoRef.value?.play('shake');
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  const direction = KEYS[event.key];
  if (!direction) return;
  // Without this the arrow keys scroll the page out from under the board.
  event.preventDefault();
  step(direction);
}

function rollSeed() {
  let next = randomNinoMazeSeed();
  while (next === currentSeed.value) next = randomNinoMazeSeed();
  currentSeed.value = next;
  emit('update:seed', next);
}

// Play again and New maze leave the button that was clicked hidden or pointless, so the keyboard
// goes back to the board.
function newMaze() {
  rollSeed();
  board.value?.focus();
}

function replay() {
  if (maze.value) state.value = createNinoMazeState(maze.value);
  board.value?.focus();
}

function toggleMute() {
  isMuted.value = !isMuted.value;
  emit('update:muted', isMuted.value);
}
</script>

<template>
  <div class="i9k-nino-maze" :class="`i9k-nino-maze--${difficulty}`">
    <div class="i9k-nino-maze__bar">
      <p class="i9k-nino-maze__meta">
        <span v-if="code" class="i9k-nino-maze__code" data-maze-code>
          {{ text.mazeCode({ code }) }}
        </span>
        <span class="i9k-nino-maze__moves" data-maze-moves>
          {{ text.moveCount({ moves: state?.moves ?? 0 }) }}
        </span>
      </p>
      <div class="i9k-nino-maze__actions">
        <I9kIconButton
          icon="dice"
          :label="text.newMaze"
          variant="ghost"
          size="sm"
          :disabled="!state"
          data-maze-new
          @click="newMaze"
        />
        <I9kIconButton
          :icon="isMuted ? 'volumeOff' : 'volumeOn'"
          :label="text.mute"
          :aria-pressed="isMuted ? 'true' : 'false'"
          variant="ghost"
          size="sm"
          data-maze-mute
          @click="toggleMute"
        />
      </div>
    </div>

    <!-- A named group: ARIA allows no name on a role-less div, and this name is how a
         screen-reader user learns to play from the keyboard. -->
    <div
      ref="board"
      class="i9k-nino-maze__board"
      role="group"
      tabindex="0"
      :aria-label="text.board"
      :aria-busy="state ? undefined : 'true'"
      data-maze-board
      @keydown="onKeydown"
    >
      <svg class="i9k-nino-maze__grid" :viewBox="viewBox" role="img" :aria-labelledby="titleId">
        <title :id="titleId">{{ text.mazeDescription }}</title>

        <template v-if="state">
          <rect
            v-for="tile in layout.floor"
            :key="`dot-${tile.x}-${tile.y}`"
            class="i9k-nino-maze__dot"
            :x="tile.x * TILE + 7"
            :y="tile.y * TILE + 7"
            width="2"
            height="2"
          />
          <rect
            v-for="wall in layout.walls"
            :key="`wall-${wall.x}-${wall.y}`"
            class="i9k-nino-maze__wall"
            :x="wall.x * TILE + 1"
            :y="wall.y * TILE + 1"
            :width="TILE - 2"
            :height="TILE - 2"
            rx="3"
            data-maze-wall
          />

          <g
            class="i9k-nino-maze__home"
            :transform="`translate(${state.maze.home.x * TILE} ${state.maze.home.y * TILE})`"
          >
            <rect
              class="i9k-nino-maze__home-tile"
              x="1"
              y="1"
              :width="TILE - 2"
              :height="TILE - 2"
              rx="3"
            />
            <path class="i9k-nino-maze__home-roof" d="M3 8L8 3L13 8V13H9V10H7V13H3V8Z" />
          </g>

          <!-- A software bug, drawn rather than imported: a body, a head and six legs, all on
               the same whole-pixel grid as Nino. -->
          <g
            v-for="(bug, index) in state.bugs"
            :key="`bug-${index}`"
            class="i9k-nino-maze__bug"
            :transform="`translate(${bug.position.x * TILE} ${bug.position.y * TILE})`"
            data-maze-bug
          >
            <rect class="i9k-nino-maze__bug-leg" x="1" y="6" width="14" height="2" />
            <rect class="i9k-nino-maze__bug-leg" x="1" y="9" width="14" height="2" />
            <rect class="i9k-nino-maze__bug-body" x="4" y="4" width="8" height="9" />
            <rect class="i9k-nino-maze__bug-head" x="6" y="2" width="4" height="3" />
            <rect class="i9k-nino-maze__bug-eye" x="5" y="6" width="2" height="2" />
            <rect class="i9k-nino-maze__bug-eye" x="9" y="6" width="2" height="2" />
          </g>

          <g
            class="i9k-nino-maze__nino"
            :data-nino-tile="`${state.nino.x},${state.nino.y}`"
            :transform="`translate(${state.nino.x * TILE} ${state.nino.y * TILE})`"
          >
            <I9kNino
              ref="ninoRef"
              size="auto"
              x="0"
              y="0"
              :width="TILE"
              :height="TILE"
              :expression="ninoExpression"
              :label="text.ninoName"
            />
          </g>
        </template>
      </svg>
    </div>

    <!-- A d-pad is spatial, like the board above it: the button that points left sits on the left
         on an Arabic page too. Same reason the arrow keys stay literal. -->
    <div class="i9k-nino-maze__pad">
      <I9kIconButton
        v-for="direction in NINO_MAZE_DIRECTIONS"
        :key="direction"
        :class="['i9k-nino-maze__key', `i9k-nino-maze__key--${direction}`]"
        :icon="ICONS[direction]"
        :label="text[direction]"
        variant="secondary"
        :disabled="!playable"
        :data-direction="direction"
        @click="step(direction)"
      />
    </div>

    <p class="i9k-nino-maze__status" role="status" aria-live="polite" data-maze-status>
      {{ announcement }}
    </p>

    <div v-if="state?.status === 'won'" class="i9k-nino-maze__win">
      <I9kButton variant="primary" size="sm" data-maze-replay @click="replay">
        {{ text.playAgain }}
      </I9kButton>
      <I9kButton variant="default" size="sm" data-maze-next @click="newMaze">
        {{ text.newMaze }}
      </I9kButton>
    </div>
  </div>
</template>

<style scoped>
.i9k-nino-maze {
  --i9k-nino-maze-floor: var(--surface-sunken-color);
  --i9k-nino-maze-border: var(--border-color);
  --i9k-nino-maze-wall: var(--primary-text-color);
  --i9k-nino-maze-dot: var(--border-color);
  --i9k-nino-maze-home: var(--primary-text-color);
  --i9k-nino-maze-bug: var(--error-color);

  display: grid;
  justify-items: center;
  gap: var(--spacing-8);
  inline-size: min(100%, 36rem);
  margin-inline: auto;
  color: var(--text-color);
}

.i9k-nino-maze--hard {
  inline-size: min(100%, 46rem);
}

.i9k-nino-maze__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-6);
  inline-size: 100%;
}

.i9k-nino-maze__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2) var(--spacing-8);
  margin: 0;
  color: var(--text-color-light);
  font-size: var(--control-font-size-sm);
  font-variant-numeric: tabular-nums;
}

.i9k-nino-maze__code {
  color: var(--text-color);
  font-weight: 600;
  letter-spacing: 0.04em;
  unicode-bidi: isolate;
}

.i9k-nino-maze__actions {
  display: flex;
  gap: var(--spacing-2);
}

.i9k-nino-maze__board {
  box-sizing: border-box;
  inline-size: 100%;
  padding: var(--spacing-4);
  border: 1px solid var(--i9k-nino-maze-border);
  border-radius: var(--radius-md);
  background: var(--i9k-nino-maze-floor);
}

.i9k-nino-maze__board:focus-visible {
  outline: 2px solid var(--focus-color);
  outline-offset: 2px;
}

.i9k-nino-maze__grid {
  display: block;
  inline-size: 100%;
  block-size: auto;
  overflow: visible;
}

.i9k-nino-maze__wall {
  fill: var(--i9k-nino-maze-wall);
}

.i9k-nino-maze__dot {
  fill: var(--i9k-nino-maze-dot);
}

.i9k-nino-maze__home-tile {
  fill: color-mix(in srgb, var(--i9k-nino-maze-home) 18%, transparent);
}

.i9k-nino-maze__home-roof {
  fill: var(--i9k-nino-maze-home);
}

.i9k-nino-maze__bug-body,
.i9k-nino-maze__bug-head,
.i9k-nino-maze__bug-leg {
  fill: var(--i9k-nino-maze-bug);
}

.i9k-nino-maze__bug-eye {
  fill: var(--i9k-nino-maze-floor);
}

/* Tile-to-tile movement is a stepped transition, so a step reads as a sprite's step. */
.i9k-nino-maze__nino,
.i9k-nino-maze__bug {
  transition: transform 140ms steps(2, end);
}

.i9k-nino-maze__pad {
  display: grid;
  grid-template-areas:
    '. up .'
    'left down right';
  gap: var(--spacing-4);
  direction: ltr;
}

.i9k-nino-maze__key--up {
  grid-area: up;
}

.i9k-nino-maze__key--down {
  grid-area: down;
}

.i9k-nino-maze__key--left {
  grid-area: left;
}

.i9k-nino-maze__key--right {
  grid-area: right;
}

.i9k-nino-maze__status {
  min-block-size: 1.5em;
  margin: 0;
  color: var(--text-color-light);
  text-align: center;
}

.i9k-nino-maze__win {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--spacing-4);
}

@media (prefers-reduced-motion: reduce) {
  .i9k-nino-maze__nino,
  .i9k-nino-maze__bug {
    transition: none;
  }
}
</style>
