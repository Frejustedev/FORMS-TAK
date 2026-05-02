import { defineConfig } from 'eslint/config';
import next from 'eslint-config-next';

export default defineConfig([
  {
    ignores: [
      'dist/**/*',
      '.next/**/*',
      'out/**/*',
      'node_modules/**/*',
      'public/sw.js',
      'electron/**/*',
      'coverage/**/*',
      'android/**/*',
      'ios/**/*',
    ],
  },
  {
    extends: [...next],
    rules: {
      'react/no-unescaped-entities': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
]);
