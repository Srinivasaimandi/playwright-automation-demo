import eslint from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['app/**', 'node_modules/**', 'playwright-report/**', 'reports/**', 'test-results/**'],
  },
  {
    files: ['**/*.{js,cjs,mjs}'],
    languageOptions: {
      globals: globals.node,
    },
    rules: eslint.configs.recommended.rules,
  },
];
