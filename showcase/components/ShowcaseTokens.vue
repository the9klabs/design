<script setup lang="ts">
import { colorTokens } from 'virtual:showcase-data';

const spacingTokens = [
  '--spacing-1',
  '--spacing-2',
  '--spacing-3',
  '--spacing-4',
  '--spacing-6',
  '--spacing-8',
  '--spacing-10',
  '--spacing-13',
  '--spacing-18',
];

const controlTokens = [
  '--control-height-sm',
  '--control-height-md',
  '--control-height-lg',
  '--control-font-size-sm',
  '--control-font-size-md',
  '--control-font-size-lg',
  '--component-gap-sm',
  '--component-gap-md',
  '--component-gap-lg',
];

const radiusTokens = ['--radius-sm', '--radius-md', '--radius-lg', '--radius-pill'];

const columnTokens = [
  '--container-width-sm',
  '--container-width-md',
  '--container-width-lg',
  '--container-gutter',
];
</script>

<template>
  <div class="showcase-tokens">
    <section>
      <h3 id="tokens-color">Color</h3>
      <p>
        Every color custom property declared in <code>src/styles/tokens.css</code>, read from that
        file at build time. Each swatch paints its literal value, so alpha tokens show against the
        checkerboard behind them.
      </p>

      <h4 id="tokens-color-brand">Brand</h4>
      <p>Theme-independent values defined on <code>:root</code>.</p>
      <ul class="showcase-tokens__colors">
        <li v-for="token in colorTokens.brand" :key="token.name">
          <span class="showcase-tokens__swatch">
            <span :style="{ background: token.value }" />
          </span>
          <code class="showcase-tokens__name">{{ token.name }}</code>
          <span class="showcase-tokens__value">{{ token.hsl }}</span>
          <span class="showcase-tokens__value">{{ token.hex }}</span>
        </li>
      </ul>

      <h4 id="tokens-color-theme">Theme</h4>
      <p>
        Redefined per theme on <code>html.light</code> and <code>html.dark</code>. Components read
        the token name; the value follows the class on <code>&lt;html&gt;</code>.
      </p>
      <ul class="showcase-tokens__colors">
        <li v-for="token in colorTokens.theme" :key="token.name">
          <span class="showcase-tokens__swatch showcase-tokens__swatch--split">
            <span :style="{ background: token.light?.value }" />
            <span :style="{ background: token.dark?.value }" />
          </span>
          <code class="showcase-tokens__name">{{ token.name }}</code>
          <span v-if="token.light" class="showcase-tokens__value">
            <b>Light</b> {{ token.light.hsl }} · {{ token.light.hex }}
          </span>
          <span v-if="token.dark" class="showcase-tokens__value">
            <b>Dark</b> {{ token.dark.hsl }} · {{ token.dark.hex }}
          </span>
        </li>
      </ul>
    </section>

    <section>
      <h3 id="tokens-spacing">Spacing</h3>
      <ul class="showcase-tokens__bars">
        <li v-for="token in spacingTokens" :key="token">
          <code>{{ token }}</code>
          <span class="showcase-tokens__bar" :style="{ inlineSize: `var(${token})` }" />
        </li>
      </ul>
    </section>

    <section>
      <h3 id="tokens-radius">Radius</h3>
      <ul class="showcase-tokens__swatches">
        <li v-for="token in radiusTokens" :key="token">
          <span class="showcase-tokens__swatch" :style="{ borderRadius: `var(${token})` }" />
          <code>{{ token }}</code>
        </li>
      </ul>
    </section>

    <section>
      <h3 id="tokens-control">Control scale</h3>
      <p>
        Components declare local custom properties on their root class and redefine them per size
        modifier, drawing from this shared scale rather than from raw brand values.
      </p>
      <ul class="showcase-tokens__list">
        <li v-for="token in controlTokens" :key="token">
          <code>{{ token }}</code>
        </li>
      </ul>
    </section>

    <section>
      <h3 id="tokens-column">Page column</h3>
      <p>
        The one measure the site chrome and every page section share.
        <code>I9kContainer</code> reads it, and so do <code>I9kNavigation</code>,
        <code>I9kFooter</code> and <code>I9kPageContainer</code>; the gutter is what each side keeps
        on a viewport narrower than the column.
      </p>
      <ul class="showcase-tokens__list">
        <li v-for="token in columnTokens" :key="token">
          <code>{{ token }}</code>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.showcase-tokens {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-13);
}

ul {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-6);
  margin: 0;
  padding: 0;
  list-style: none;
}

.showcase-tokens__bars,
.showcase-tokens__list {
  flex-direction: column;
  gap: var(--spacing-3);
}

.showcase-tokens__colors {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
  gap: var(--spacing-8);
}

.showcase-tokens__colors li {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  min-inline-size: 0;
}

.showcase-tokens__name {
  font-size: var(--text-size-1);
  overflow-wrap: anywhere;
}

.showcase-tokens__value {
  font-size: 0.75rem;
  color: var(--text-color-light);
  overflow-wrap: anywhere;
}

.showcase-tokens__value b {
  font-weight: 600;
  color: var(--theme-text-color);
}

.showcase-tokens__swatch {
  display: block;
  inline-size: 4rem;
  block-size: 4rem;
  border: 1px solid var(--border-color);
  background: var(--primary-color);
}

/* Checkerboard so a token's alpha channel is visible in the swatch rather than reading as an
   opaque color mixed with the page background. */
.showcase-tokens__colors .showcase-tokens__swatch {
  inline-size: 100%;
  block-size: 3.5rem;
  background: repeating-conic-gradient(var(--border-color) 0% 25%, transparent 0% 50%) 50% / 12px
    12px;
}

.showcase-tokens__swatch--split {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.showcase-tokens__swatch > span {
  display: block;
  block-size: 100%;
}

.showcase-tokens__bar {
  display: inline-block;
  block-size: 0.75rem;
  background: var(--accent-color);
}

code {
  font-size: 0.75rem;
}
</style>
