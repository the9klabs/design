import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import vue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '.playwright-mcp/',
      '.worktrees/',
      'dist/',
      'node_modules/',
      'showcase-dist/',
      'showcase/.vitepress/.temp/',
      'showcase/.vitepress/cache/',
      'storybook-static/',
    ],
  },
  js.configs.recommended,
  ...vue.configs['flat/recommended'],
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
    },
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
      },
    },
  },
  {
    files: ['**/*.{ts,vue}'],
    rules: {
      'no-undef': 'off',
    },
  },
  {
    files: ['tests/**/*.ts'],
    rules: {
      'vue/one-component-per-file': 'off',
    },
  },
  prettier,
);
