import postcss, { type AtRule, type PluginCreator } from 'postcss';

// The package's one cascade order. `src/styles/index.css` declares it too; every component
// stylesheet repeats it, so the order is the same whichever file the browser reads first.
export const LAYER_ORDER =
  'normalize, fonts, tokens, theme, base, primitives, utilities, components';

// Layering these changes nothing (fonts and keyframes are not ordered by the cascade), and
// `@charset` must stay first, so they stay outside the block.
const UNLAYERED = new Set(['charset', 'font-face', 'keyframes', '-webkit-keyframes']);

const isVueStyle = (file: string | undefined) => !!file && /\.vue(\?|$)/.test(file);

// Puts every rule of a component's style block into `@layer components`, below any rule a
// consumer writes outside a layer. Vue has already scoped the block's selectors, so `[data-v-…]`,
// `:deep()` and nested `@media`, `@supports` and `@container` blocks move in unchanged.
export const componentsLayer: PluginCreator<void> = () => ({
  postcssPlugin: 'i9k-components-layer',
  Once(root) {
    if (!isVueStyle(root.source?.input.file)) return;

    const layer = postcss.atRule({ name: 'layer', params: 'components' });
    for (const node of [...root.nodes]) {
      if (!(node.type === 'atrule' && UNLAYERED.has((node as AtRule).name))) layer.append(node);
    }

    const order = postcss.atRule({ name: 'layer', params: LAYER_ORDER });
    const charset =
      root.first?.type === 'atrule' && root.first.name === 'charset' ? root.first : null;
    if (charset) charset.after(order);
    else root.prepend(order);
    if (layer.nodes?.length) order.after(layer);
  },
});
componentsLayer.postcss = true;
